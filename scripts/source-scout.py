#!/usr/bin/env python3
"""
AuraClaw 内容侦察员 v5
修复：GLM-5.1 筛选韧性 / 接受上限3条 / 受控来源扩张 / URL规范化去重 /
      真递归抓取 / GitHub深层+标题提取 / source_name友好化 /
      content_type智能 / needs_manual_review默认true / API Key环境变量 /
      语义去重增强 / 内部质量评分 / 站外发现能力
"""

import os
import re
import time
import json
import subprocess
import html as html_module
import base64
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Set, Optional, Any, Tuple
from urllib.parse import urljoin, urlparse, urlunparse, parse_qs, urlencode
import requests
from bs4 import BeautifulSoup
import yaml
import urllib.request

# ============ 配置 ============

# 第一层：核心种子来源
SEED_SOURCES = {
    "openclaw101.club": "https://www.openclaw101.club/",
    "openclawcn.cc": "https://openclawcn.cc/",
    "claw101.com": "https://claw101.com/",
    "github-openclaw101": "https://github.com/mengjian-github/openclaw101",
    "github-awesome-tutorial": "https://github.com/xianyu110/awesome-openclaw-tutorial",
    "github-awesome-skills": "https://github.com/VoltAgent/awesome-openclaw-skills",
    "openclawskill.ai": "https://openclawskill.ai/",
}

# 来源友好显示名
SOURCE_DISPLAY_NAMES = {
    "openclaw101.club": "OpenClaw101.club",
    "openclawcn.cc": "OpenClaw 中文社区",
    "claw101.com": "Claw101",
    "github-openclaw101": "GitHub / openclaw101",
    "github-awesome-tutorial": "GitHub / awesome-openclaw-tutorial",
    "github-awesome-skills": "GitHub / awesome-openclaw-skills",
    "openclawskill.ai": "OpenClawSkill.ai",
}

AURACLAW_ROOT = Path("/Users/joe/Documents/New project/auraclaw")
HARVEST_DIR = AURACLAW_ROOT / "content/inbox/source-harvest"

# GLM API 配置（#9: 从环境变量读取）
GLM_API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
GLM_API_KEY = os.environ.get("AURACLAW_GLM_API_KEY", "")
if not GLM_API_KEY:
    env_file = Path(__file__).parent / ".env"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            line = line.strip()
            if line.startswith("AURACLAW_GLM_API_KEY="):
                GLM_API_KEY = line.split("=", 1)[1].strip().strip('"').strip("'")
                break

if not GLM_API_KEY:
    print("⚠️  AURACLAW_GLM_API_KEY 未设置！请设置环境变量或在脚本同目录创建 .env 文件")
    print("   export AURACLAW_GLM_API_KEY='your-key-here'")

GLM_MODEL_PRIMARY = "glm-5.1"    # v5: 主模型改为 GLM-5.1
GLM_MODEL_FALLBACK = "glm-4.7"   # v5: fallback 模型
GLM_TIMEOUT = 60                  # v5: 缩短到 60 秒（快速失败 + 重试）

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
}

# 抓取深度配置
MAX_PAGES_PER_SITE = 20  # #4: 每站点最多20页
MAX_DISCOVERED_SOURCES = 5  # #2: 每轮最多发现5个新来源

PRIORITY_PATHS = ['docs/', 'guides/', 'cases/', 'blog/', 'examples/', 'content/days/',
                  'tutorials/', 'advanced/', 'config/']

# #3: 英文拒绝域名
REJECT_ENGLISH_DOMAINS = [
    'amd.com', 'intel.com', 'nvidia.com', 'aws.amazon.com',
    'azure.microsoft.com', 'cloud.google.com', 'openai.com'
]

# #12: 站外发现 - 允许的域名模式
DISCOVERY_ALLOWED_PATTERNS = [
    r'github\.com/[^/]+/[^/]+',     # GitHub 仓库
    r'openclaw',                      # 包含 openclaw
    r'claw',                          # 包含 claw
    r'agent.*skill',                  # agent skill 相关
    r'ai.*workflow',                  # AI workflow
]

# #12: 站外发现 - 严格拒绝
DISCOVERY_REJECT_PATTERNS = [
    r'twitter\.com', r'x\.com', r'facebook\.com', r'instagram\.com',
    r'linkedin\.com', r'weibo\.com',
    r'zhihu\.com/question/',  # 知乎问答（非专栏）
]

# #7: content_type 映射关键词
CONTENT_TYPE_KEYWORDS = {
    'source_map': ['资源', '索引', '导航', 'awesome', '精选', 'collection', 'curated', '地图'],
    'workflow': ['工作流', '自动化', '定时', 'cron', '监控', '日报', '周报', '流程'],
    'example': ['example', '示例', '脚本', 'script', 'demo', 'sample', '配置示例'],
    'config': ['配置', 'config', '设置', '安装', '部署', 'deploy', 'setup'],
    'guide': ['指南', 'guide', '入门', '起步', '入门指南', '快速开始'],
    'deep_dive': ['深入', '原理', '架构', '源码', '进阶', '深度', '解析'],
    'tutorial': ['教程', 'tutorial', '实战', '从零'],
}


# ============ #3: URL 规范化 ============

def canonicalize_url(url: str) -> str:
    """URL 规范化：去 fragment、追踪参数、统一尾部斜杠、GitHub 归一"""
    if not url:
        return ""

    parsed = urlparse(url.strip())
    path = re.sub(r'/+', '/', parsed.path or '/')
    scheme = 'https'
    netloc = parsed.netloc.lower().replace('www.github.com', 'github.com')

    if netloc == 'github.com':
        file_match = re.match(r'^/([^/]+)/([^/]+)/(?:blob|raw|tree|html)/([^/]+)/(.+)$', path)
        repo_match = re.match(r'^/([^/]+)/([^/]+)/?$', path)

        if file_match:
            owner, repo, ref, subpath = file_match.groups()
            subpath = subpath.strip('/')
            path = f"/{owner}/{repo}/blob/{ref}/{subpath}"
        elif repo_match:
            owner, repo = repo_match.groups()
            path = f"/{owner}/{repo}"

    if path != '/' and path.endswith('/'):
        path = path.rstrip('/')
    elif path == '' or path == '/':
        path = '/'

    params_to_remove = {'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
                        'ref', 'source', 'fbclid', 'gclid'}
    query_params = parse_qs(parsed.query, keep_blank_values=True)
    filtered_params = {k: v for k, v in query_params.items() if k not in params_to_remove}
    new_query = urlencode(filtered_params, doseq=True) if filtered_params else ''

    return urlunparse((scheme, netloc, path, parsed.params, new_query, ''))


# ============ #4: 编码和文本清洗 ============

def clean_text(text: str) -> str:
    """清洗文本：编码归一化、去乱码、去HTML实体、去控制字符"""
    if not text:
        return ""

    try:
        text = text.encode('utf-8', errors='replace').decode('utf-8')
    except Exception:
        pass

    if any(token in text for token in ['Ã', 'Â', 'â', 'ð']):
        try:
            repaired = text.encode('latin1', errors='ignore').decode('utf-8', errors='ignore')
            if repaired and repaired.count('�') <= text.count('�'):
                text = repaired
        except Exception:
            pass

    try:
        text = html_module.unescape(text)
    except Exception:
        pass

    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    text = re.sub(r'[^\u0020-\u007e\u00a0-\u00ff\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]{3,}', '', text)
    text = re.sub(r'\s+', ' ', text).strip()

    return text


def normalize_title(title: str) -> str:
    """标题规范化：去 markdown 包裹、文件扩展名、站点后缀和多余分隔符"""
    title = clean_text(title)
    if not title:
        return ""

    title = re.sub(r'~~\s*(.*?)\s*~~', r'\1', title)
    title = re.sub(r'^\s*[#>*`\-]+\s*', '', title)
    title = re.sub(r'\s*[`*_]+\s*', ' ', title)
    title = re.sub(r'\[(.*?)\]\([^)]+\)', r'\1', title)
    title = re.sub(r'\.md$', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\s*[-|·]\s*(OpenClaw101\.club|Claw101|OpenClaw 中文社区|GitHub.*)$', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\s*[-|]\s*[^-|]+$', '', title)
    title = re.sub(r'\s+', ' ', title).strip(' -|_`~')

    return title


def is_title_readable(title: str) -> bool:
    """判断标题是否可读（至少4个有效字符）"""
    cleaned = normalize_title(title)
    if len(cleaned) < 4:
        return False
    zh_chars = len(re.findall(r'[\u4e00-\u9fff]', cleaned))
    en_chars = len(re.findall(r'[a-zA-Z]', cleaned))
    return zh_chars >= 2 or en_chars >= 4


# ============ #3: 语言检测和过滤 ============

def detect_language(text: str) -> str:
    """检测文本语言：zh / en / mixed"""
    if not text:
        return 'en'
    zh_chars = len(re.findall(r'[\u4e00-\u9fff]', text))
    total_chars = len(re.findall(r'[a-zA-Z\u4e00-\u9fff]', text))
    if total_chars == 0:
        return 'en'
    if zh_chars / total_chars > 0.3:
        return 'zh'
    if zh_chars > 0:
        return 'mixed'
    return 'en'


def should_reject_english(source_url: str, title: str, body_text: str) -> Tuple[bool, str]:
    """判断英文内容是否应该拒绝"""
    language = detect_language(f"{title} {body_text}")
    if language == 'zh' or language == 'mixed':
        return False, ""
    
    for domain in REJECT_ENGLISH_DOMAINS:
        if domain in source_url:
            return True, f"英文硬件/云服务厂商宣传页（{domain}）"
    
    marketing_keywords = ['announce', 'launch', 'release', 'performance', 'benchmark',
                          'specs', 'hardware', 'chip', 'processor', 'gpu', 'cpu']
    title_lower = title.lower()
    if sum(1 for kw in marketing_keywords if kw in title_lower) >= 2:
        return True, "英文硬件营销/性能宣传页"
    
    return False, ""


# ============ #4: 正文页判断 ============

def is_content_page(url: str, title: str, body_text: str) -> Tuple[bool, str]:
    """判断是否是正文页"""
    skip_patterns = [
        r'^https?://[^/]+/?$',
        r'/search', r'/login', r'/register', r'/about', r'/contact', r'/privacy', r'/terms',
    ]
    for pattern in skip_patterns:
        if re.search(pattern, url, re.IGNORECASE):
            return False, "首页/导航页"
    if len(body_text) < 200:
        return False, "内容过短（<200字符）"
    link_density = body_text.count('http') / len(body_text) if len(body_text) > 0 else 0
    if link_density > 0.1:
        return False, "目录页/链接列表"
    return True, ""


# ============ #7: content_type 智能推断 ============

def infer_content_type(title: str, url: str, body_text: str) -> str:
    """根据内容推断 content_type"""
    title_lower = normalize_title(title).lower()
    url_lower = url.lower()
    content_lower = clean_text(body_text[:500]).lower()
    combined = f"{title_lower} {url_lower} {content_lower}"

    if any(token in combined for token in ['资源索引', '资源导航', '来源索引', 'awesome', '精选资源', 'curated', '资源地图']):
        return 'source_map'

    if any(token in combined for token in [
        'api key', 'api-key', '配置', 'config', '设置', '安装', '部署', 'deploy', 'setup',
        '接入', 'channel', '渠道', 'webhook', 'oauth', 'docker', 'vps'
    ]):
        return 'config'

    if any(token in combined for token in ['工作流', 'workflow', '自动化', 'cron', '日报', '周报', '监控', '同步', '流程']):
        return 'workflow'

    if any(token in combined for token in ['脚本', 'script', 'example', '示例', 'demo', 'sample', '模板', 'yaml', 'json']):
        return 'example'

    if any(token in combined for token in ['深入', '原理', '架构', '源码', '进阶', '深度', '解析', '会话管理', '记忆机制']):
        return 'deep_dive'

    if any(token in combined for token in [
        '什么是', '认识', '初识', '介绍', 'introduction', 'what-is', 'what is',
        'getting-started', 'quick-start', '快速上手', '第1天', '第3章节', '学习路径'
    ]):
        return 'guide'

    if any(token in combined for token in ['教程', 'tutorial', '实战', '从零', '7天', 'day', '章节']):
        return 'tutorial'

    return 'guide'


def infer_board_fit(title: str, body_text: str) -> str:
    """根据内容推断最可能适合的板块"""
    title_norm = normalize_title(title)
    combined = f"{title_norm} {clean_text(body_text[:500])}".lower()
    ctype = infer_content_type(title_norm, '', body_text)

    if any(w in combined for w in ['一人公司', 'opc', '自动化', '工作流', '日报', '周报', '情报台', '内容公司']):
        return 'opc'
    if any(w in combined for w in ['记忆', '人设', 'soul', 'persona', '对话', 'prompt', '表达', '会话']):
        return 'dialogue'
    if any(w in combined for w in [
        '新手', '入门', '起步', '快速上手', '什么是', '认识', '第1天', '学习路径', '初识'
    ]):
        return 'care'
    if any(w in combined for w in ['部署', 'docker', 'vps', '服务器', 'install', 'deploy', '运维', '监控']):
        return 'extension'
    if any(w in combined for w in ['飞书', '微信', 'telegram', 'discord', 'whatsapp', '平台', '接入', 'channel']):
        return 'extension'
    if any(w in combined for w in ['产后', '母婴', '护理', '育儿', 'baby']):
        return 'care'
    if ctype in {'guide', 'tutorial'}:
        return 'care'
    return 'extension'


# ============ #11: 内部质量评分 ============

def score_candidate(candidate: Dict[str, Any]) -> Dict[str, float]:
    """对候选内容进行内部评分"""
    title = normalize_title(candidate.get('title', ''))
    content = clean_text(candidate.get('content', ''))
    url = candidate.get('url', '')
    language = candidate.get('language', 'en')

    board_fit = infer_board_fit(title, content)
    content_type = infer_content_type(title, url, content)
    combined = f"{title} {content}".lower()
    generic_intro = any(token in combined for token in ['什么是', '认识', '介绍', '初识', 'what is', 'introduction'])

    relevance_keywords = {
        'care': ['新手', '入门', '起步', '快速上手', '零基础', '第一次', '学习路径', '是什么'],
        'extension': ['能力', 'skill', '插件', '接入', '监控', '抓取', '浏览器', 'github', '扩展', '配置', '部署'],
        'dialogue': ['提示词', 'prompt', '对话', '表达', '训练', '人设', 'soul', '记忆', '会话'],
        'opc': ['一人公司', '自动化', '工作流', '日报', '周报', '情报', '内容创作', 'opc', '同步'],
    }

    board_hits = relevance_keywords.get(board_fit, [])
    title_hits = sum(1 for kw in board_hits if kw in title.lower())
    body_hits = sum(1 for kw in board_hits if kw in combined)
    relevance = min(title_hits * 0.28 + min(body_hits, 4) * 0.11, 0.78)
    if content_type in {'config', 'workflow', 'deep_dive'}:
        relevance += 0.12
    elif content_type in {'guide', 'tutorial'}:
        relevance += 0.06
    if generic_intro and board_fit != 'care':
        relevance *= 0.78
    relevance = min(relevance, 0.98)

    novelty_reason = candidate.get('novelty_reason', '')
    if novelty_reason == '新内容':
        novelty = 0.95
    elif '补全' in novelty_reason:
        novelty = 0.72
    else:
        novelty = 0.45

    exec_keywords = ['脚本', '配置', '命令', '示例', '代码', 'script', 'config', 'command', 'yaml', 'json',
                     'docker', 'webhook', '同步', '监控', '日报', '周报']
    execution = 0.12
    if content_type == 'workflow':
        execution += 0.28
    elif content_type == 'config':
        execution += 0.32
    elif content_type == 'example':
        execution += 0.24
    elif content_type == 'deep_dive':
        execution += 0.16
    execution += min(sum(1 for kw in exec_keywords if kw in combined) * 0.06, 0.42)
    if generic_intro:
        execution *= 0.58
    execution = min(execution, 0.95)

    china = {'zh': 0.72, 'mixed': 0.42, 'en': 0.08}.get(language, 0.08)
    china_keywords = ['中文', '国内', '飞书', '钉钉', '企微', '微信', '阿里云', '腾讯云', '字节', '企业微信']
    china += min(sum(1 for kw in china_keywords if kw in combined) * 0.07, 0.24)
    china = min(china, 0.96)

    total = relevance * 0.34 + novelty * 0.22 + execution * 0.24 + china * 0.20
    if generic_intro and content_type in {'guide', 'tutorial'}:
        total -= 0.06
    total = max(0.05, min(total, 0.98))

    return {
        'relevance_score': round(relevance, 2),
        'novelty_score': round(novelty, 2),
        'execution_value_score': round(execution, 2),
        'china_fit_score': round(china, 2),
        'total_score': round(total, 2),
    }


# ============ 3层去重 ============

def load_existing_published_content() -> Tuple[Set[str], Set[str], List[str]]:
    """第一层：加载已发布内容的 URL 和标题"""
    urls = set()
    titles = set()
    summaries = []
    
    for fpath in [AURACLAW_ROOT / "src/source-notes.ts", AURACLAW_ROOT / "src/data.ts"]:
        if fpath.exists():
            try:
                content = fpath.read_text(encoding="utf-8")
                urls.update(re.findall(r'sourceUrl:\s*["\']([^"\']+)["\']', content))
                titles.update(re.findall(r'title:\s*["\']([^"\']+)["\']', content))
                note_blocks = re.findall(r'\{[^}]*title:[^}]*\}', content, re.DOTALL)
                for block in note_blocks:
                    t = re.search(r'title:\s*["\']([^"\']+)["\']', block)
                    if t:
                        summaries.append(t.group(1))
            except Exception:
                pass
    
    sources_dir = AURACLAW_ROOT / "content/sources"
    if sources_dir.exists():
        for yaml_file in sources_dir.glob("*.yaml"):
            try:
                with open(yaml_file, 'r', encoding='utf-8') as f:
                    data = yaml.safe_load(f)
                    if data and 'source_notes' in data:
                        for item in data['source_notes']:
                            if 'source_url' in item:
                                urls.add(item['source_url'])
                            if 'title' in item:
                                titles.add(item['title'])
                                summaries.append(item['title'])
            except Exception:
                pass
    
    return urls, titles, summaries


def load_pending_review_content() -> Dict[str, Dict[str, Any]]:
    """第二层：加载待审核内容"""
    url_to_record = {}
    if not HARVEST_DIR.exists():
        return url_to_record
    for yaml_file in sorted(HARVEST_DIR.glob("*.yaml"), reverse=True):
        try:
            with open(yaml_file, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
                if data and 'accepted_candidates' in data:
                    for item in data['accepted_candidates']:
                        url = item.get('source_url', '')
                        if url and url not in url_to_record:
                            url_to_record[url] = {
                                'title': item.get('title', ''),
                                'content_length': len(item.get('one_line_summary', '')),
                                'file': str(yaml_file)
                            }
        except Exception:
            pass
    return url_to_record


def check_duplicate_3layers(
    candidate_url: str, candidate_title: str, candidate_content: str,
    published_urls: Set[str], published_titles: Set[str],
    published_summaries: List[str], pending_records: Dict[str, Dict[str, Any]],
    canonical_url: str
) -> Tuple[bool, str, str]:
    """3层去重，返回 (是否重复, 原因, novelty_reason)"""
    # #3: 用 canonical URL 去重
    published_canonical = {canonicalize_url(u) for u in published_urls}
    pending_canonical = {canonicalize_url(u): r for u, r in pending_records.items()}
    
    if canonical_url in published_canonical:
        return True, "与已发布内容重复（URL）", ""
    if candidate_title in published_titles:
        return True, "与已发布内容重复（标题）", ""
    
    if canonical_url in pending_canonical:
        old_record = pending_canonical[canonical_url]
        new_len = len(candidate_content)
        if new_len > old_record['content_length'] * 1.3:
            return False, "", "同源补全版（内容更完整）"
        else:
            return True, "待审核重复（已有相同URL）", ""
    
    # 第三层：简单标题相似度
    ct_lower = candidate_title.lower()
    for s in published_summaries:
        s_lower = s.lower()
        if len(ct_lower) > 10 and len(s_lower) > 10:
            overlap = len(set(ct_lower) & set(s_lower))
            max_len = max(len(ct_lower), len(s_lower))
            if overlap / max_len > 0.8:
                return True, "语义重复（标题高度相似）", ""
    
    return False, "", "新内容"


# ============ 抓取工具 ============

def fetch_url(url: str, timeout: int = 10) -> Optional[str]:
    try:
        resp = requests.get(url, headers=HEADERS, timeout=(5, timeout))  # connect=5s, read=10s
        resp.raise_for_status()
        return resp.text
    except Exception:
        return None


def extract_page_content(html: str, url: str) -> Optional[Dict[str, str]]:
    """从 HTML 提取标题和正文"""
    try:
        soup = BeautifulSoup(html, 'html.parser')
        
        title = None
        h1 = soup.find('h1')
        if h1:
            title = h1.get_text(strip=True)
        if not title:
            title_tag = soup.find('title')
            if title_tag:
                title = title_tag.get_text(strip=True)

        if title:
            title = normalize_title(title)

        content_parts = []
        main_content = (soup.find('article') or soup.find('main') or
                       soup.find('div', class_=re.compile(r'content|article|post')))
        
        if main_content:
            for p in main_content.find_all(['p', 'h2', 'h3', 'li'])[:15]:
                text = p.get_text(strip=True)
                if text and len(text) > 20:
                    content_parts.append(text)
        
        if not content_parts:
            for p in soup.find_all('p')[:15]:
                text = p.get_text(strip=True)
                if text and len(text) > 20:
                    content_parts.append(text)
        
        content = ' '.join(content_parts)[:800]
        content = clean_text(content)
        
        return {'title': title, 'content': content, 'url': url}
    except Exception:
        return None


# ============ #12: 站外来源发现 ============

def discover_sources_from_content(candidates: List[Dict[str, Any]], scanned_domains: Set[str]) -> List[str]:
    """从高信任正文页中提取外链，发现新来源"""
    discovered = []
    seen = set()
    
    for c in candidates:
        content = c.get('content', '')
        # 提取 URL
        urls = re.findall(r'https?://[^\s<>"\')\]]+', content)
        for url in urls:
            # 清理 URL
            url = url.rstrip('.,;:!?')
            parsed = urlparse(url)
            domain = parsed.netloc.lower()
            
            # 跳过已扫描的域名
            if domain in scanned_domains:
                continue
            # 跳过严格拒绝的域名
            if any(re.search(p, domain) for p in DISCOVERY_REJECT_PATTERNS):
                continue
            # 只保留允许的类型
            if not any(re.search(p, url) for p in DISCOVERY_ALLOWED_PATTERNS):
                continue
            # 跳过已发现的
            canonical = canonicalize_url(url)
            if canonical in seen:
                continue
            seen.add(canonical)
            
            # 必须是首页或仓库首页（不是深层页面）
            if re.match(r'https?://[^/]+/?$', url) or re.match(r'https?://github\.com/[^/]+/[^/]+/?$', url):
                discovered.append(url)
                if len(discovered) >= MAX_DISCOVERED_SOURCES:
                    break
        
        if len(discovered) >= MAX_DISCOVERED_SOURCES:
            break
    
    return discovered


# ============ #5: GitHub 深层抓取 + 标题提取 ============

def extract_markdown_title(content: str, filename: str) -> str:
    """从 markdown 内容提取自然标题"""
    # 尝试从第一行 # 提取
    first_lines = content.strip().split('\n')[:5]
    for line in first_lines:
        h1_match = re.match(r'^#\s+(.+)$', line)
        if h1_match:
            return normalize_title(h1_match.group(1))
    
    # 尝试从 title: 提取
    for line in first_lines:
        title_match = re.match(r'^title:\s*["\']?([^"\'\n]+)', line, re.IGNORECASE)
        if title_match:
            return normalize_title(title_match.group(1))
    
    # 回退：从文件名生成友好标题
    name = Path(filename).stem
    # 去掉序号前缀
    name = re.sub(r'^\d+[\-_\.]', '', name)
    # 连字符/下划线转空格
    name = name.replace('-', ' ').replace('_', ' ')
    # 首字母大写
    name = name.title()
    return normalize_title(name)


def scrape_github_repo(repo_url: str, max_pages: int = 20) -> List[Dict[str, Any]]:
    """深层抓取 GitHub 仓库（递归一层子目录）"""
    candidates = []
    
    match = re.search(r'github\.com/([^/]+/[^/]+)', repo_url)
    if not match:
        return candidates
    
    owner_repo = match.group(1)
    print(f"  📦 抓取 GitHub 仓库: {owner_repo}")
    
    try:
        # 1. README
        readme_result = subprocess.run(
            ["gh", "api", f"repos/{owner_repo}/readme"],
            capture_output=True, text=True, timeout=30
        )
        if readme_result.returncode == 0:
            readme_data = json.loads(readme_result.stdout)
            readme_content = base64.b64decode(readme_data['content']).decode('utf-8')
            title = extract_markdown_title(readme_content, "README.md")
            candidates.append({
                'title': title,
                'content': readme_content[:1000],
                'url': repo_url,
                'crawl_depth': 'homepage',
                'type': 'github_readme'
            })
            print(f"    ✓ README")
        
        # 2. 递归一层子目录
        priority_dirs = ['docs', 'examples', 'content', 'guides', 'tutorials', 'scripts', 'advanced', 'config']
        
        for dir_name in priority_dirs:
            if len(candidates) >= max_pages:
                break
            try:
                dir_result = subprocess.run(
                    ["gh", "api", f"repos/{owner_repo}/contents/{dir_name}"],
                    capture_output=True, text=True, timeout=30
                )
                if dir_result.returncode != 0:
                    continue
                files = json.loads(dir_result.stdout)
                if not isinstance(files, list):
                    continue
                
                for file in files[:8]:  # 每个目录最多8个
                    if len(candidates) >= max_pages:
                        break
                    
                    if file['type'] == 'dir':
                        # #5: 递归一层子目录
                        sub_result = subprocess.run(
                            ["gh", "api", file['url']],
                            capture_output=True, text=True, timeout=30
                        )
                        if sub_result.returncode != 0:
                            continue
                        try:
                            sub_files = json.loads(sub_result.stdout)
                            if isinstance(sub_files, list):
                                for sub_file in sub_files[:3]:  # 子目录最多3个文件
                                    if sub_file['name'].endswith('.md') and len(candidates) < max_pages:
                                        try:
                                            fr = subprocess.run(
                                                ["gh", "api", sub_file['url']],
                                                capture_output=True, text=True, timeout=30
                                            )
                                            if fr.returncode == 0:
                                                fd = json.loads(fr.stdout)
                                                fc = base64.b64decode(fd['content']).decode('utf-8')
                                                title = extract_markdown_title(fc, sub_file['name'])
                                                candidates.append({
                                                    'title': title,
                                                    'content': fc[:1000],
                                                    'url': sub_file.get('html_url', ''),
                                                    'crawl_depth': 'tertiary',
                                                    'type': 'github_file'
                                                })
                                                print(f"    ✓ {dir_name}/{sub_file['name']}")
                                        except Exception:
                                            continue
                        except Exception:
                            continue
                        continue
                    
                    if file['name'].endswith('.md'):
                        try:
                            file_result = subprocess.run(
                                ["gh", "api", file['url']],
                                capture_output=True, text=True, timeout=30
                            )
                            if file_result.returncode == 0:
                                file_data = json.loads(file_result.stdout)
                                content = base64.b64decode(file_data['content']).decode('utf-8')
                                # #5: 用 markdown 标题替代文件名
                                title = extract_markdown_title(content, file['name'])
                                candidates.append({
                                    'title': title,
                                    'content': content[:1000],
                                    'url': file.get('html_url', ''),
                                    'crawl_depth': 'secondary',
                                    'type': 'github_file'
                                })
                                print(f"    ✓ {dir_name}/{file['name']}")
                        except Exception:
                            continue
            except Exception:
                continue
    
    except Exception as e:
        print(f"    ✗ GitHub 抓取失败: {e}")
    
    return candidates


# ============ #4: 3层网站抓取（真递归） ============

def scrape_website_3layers(source_id: str, source_url: str, max_pages: int = 20) -> Tuple[List[Dict], List[Dict]]:
    """3层抓取：homepage → secondary → tertiary"""
    candidates = []
    index_pages = []
    
    print(f"  🌐 抓取网站: {source_id}")
    
    # 第一层：首页
    html = fetch_url(source_url)
    if not html:
        return candidates, index_pages
    
    soup = BeautifulSoup(html, 'html.parser')
    homepage_data = extract_page_content(html, source_url)
    
    # 收集链接
    all_links = []
    for a in soup.find_all('a', href=True):
        href = a.get('href', '')
        text = a.get_text(strip=True)
        if not text or len(text) < 3:
            continue
        if href.startswith('#') or href.startswith('javascript:'):
            continue
        if any(ext in href.lower() for ext in ['.woff', '.css', '.js', '.json', '.png', '.jpg', '.pdf', '.svg']):
            continue
        
        full_url = urljoin(source_url, href)
        is_priority = any(p in full_url.lower() for p in PRIORITY_PATHS)
        
        # 同域名或 openclaw 相关
        parsed_source = urlparse(source_url)
        parsed_link = urlparse(full_url)
        if parsed_link.netloc == parsed_source.netloc or 'openclaw' in full_url.lower():
            all_links.append({'url': full_url, 'link_text': text, 'is_priority': is_priority})
    
    # 优先排序
    all_links.sort(key=lambda x: x['is_priority'], reverse=True)
    
    # 去重
    seen = set()
    unique_links = []
    for link in all_links:
        cu = canonicalize_url(link['url'])
        if cu not in seen:
            seen.add(cu)
            unique_links.append(link)
    
    print(f"    发现 {len(unique_links)} 个链接")
    
    # 第二层：抓取二级页面
    secondary_content_pages = []
    scraped = 0
    
    for link in unique_links[:max_pages]:
        lhtml = fetch_url(link['url'], timeout=10)
        if not lhtml:
            continue
        
        cdata = extract_page_content(lhtml, link['url'])
        if not cdata or not cdata['title']:
            continue
        if not is_title_readable(cdata['title']):
            continue
        if len(cdata['content']) < 100:
            print(f"    ✗ 内容过短: {cdata['title'][:50]}")
            continue
        
        is_cp, reject_reason = is_content_page(cdata['url'], cdata['title'], cdata['content'])
        
        if is_cp:
            candidates.append({
                'title': cdata['title'],
                'content': cdata['content'],
                'url': cdata['url'],
                'link_text': link['link_text'],
                'source_id': source_id,
                'crawl_depth': 'secondary',
                'is_content_page': True,
                'html': lhtml  # 保留 HTML 用于第三层
            })
            secondary_content_pages.append(candidates[-1])
            print(f"    ✓ [{scraped+1}] {cdata['title'][:50]}")
            scraped += 1
        else:
            # 首页/目录页
            cdata['source_id'] = source_id
            cdata['is_content_page'] = False
            index_pages.append(cdata)
            print(f"    ✗ {reject_reason}: {cdata['title'][:50]}")
        
        if scraped >= max_pages:
            break
    
    # 第三层：从高价值二级页继续深入
    tertiary_scraped = 0
    for sp in secondary_content_pages:
        if tertiary_scraped >= 3 or scraped + tertiary_scraped >= max_pages:  # 每站 tertiary 最多3页
            break
        
        if not sp.get('html'):
            continue
        
        # 从二级页提取高价值路径链接
        sub_soup = BeautifulSoup(sp['html'], 'html.parser')
        base_url = sp['url']
        base_parsed = urlparse(base_url)
        
        for a in sub_soup.find_all('a', href=True):
            href = a.get('href', '')
            if not href or href.startswith('#') or href.startswith('javascript:'):
                continue
            full_url = urljoin(base_url, href)
            cu = canonicalize_url(full_url)
            if cu in seen:
                continue
            if not any(p in full_url.lower() for p in PRIORITY_PATHS):
                continue
            # 同域名
            fp = urlparse(full_url)
            if fp.netloc != base_parsed.netloc:
                continue
            
            seen.add(cu)
            thtml = fetch_url(full_url, timeout=10)
            if not thtml:
                continue
            
            tcdata = extract_page_content(thtml, full_url)
            if not tcdata or not tcdata['title']:
                continue
            if not is_title_readable(tcdata['title']):
                continue
            if len(tcdata['content']) < 100:
                continue
            
            is_cp, rr = is_content_page(tcdata['url'], tcdata['title'], tcdata['content'])
            if is_cp:
                candidates.append({
                    'title': tcdata['title'],
                    'content': tcdata['content'],
                    'url': tcdata['url'],
                    'source_id': source_id,
                    'crawl_depth': 'tertiary',
                    'is_content_page': True
                })
                tertiary_scraped += 1
                print(f"    ✓ [3rd] {tcdata['title'][:50]}")
    
    return candidates, index_pages


# ============ #10: 语义去重增强 ============

def get_relevant_existing_summaries(candidates: List[Dict], all_summaries: List[str]) -> List[str]:
    """关键词召回相关已发布内容，而非固定前20条"""
    if not all_summaries:
        return []
    
    # 从候选标题提取关键词
    candidate_keywords = set()
    for c in candidates[:10]:
        title = c.get('title', '')
        # 提取中文词（2-4字）
        candidate_keywords.update(re.findall(r'[\u4e00-\u9fff]{2,4}', title))
        # 提取英文词
        candidate_keywords.update(re.findall(r'[a-zA-Z]{3,}', title.lower()))
    
    if not candidate_keywords:
        return all_summaries[:15]
    
    # 对已有摘要按关键词匹配度排序
    scored = []
    for s in all_summaries:
        score = sum(1 for kw in candidate_keywords if kw in s.lower())
        scored.append((score, s))
    
    scored.sort(reverse=True)
    # 取匹配度最高的 + 一些随机补充
    top = [s for _, s in scored[:10] if _ > 0]
    rest = [s for _, s in scored if _ == 0][:5]
    return top + rest


# ============ GLM 语义筛选（v5: 重试 + 降载 + fallback） ============

def _build_glm_prompt(candidates: List[Dict[str, Any]], existing_summaries: List[str],
                      pending_titles: List[str]) -> str:
    """构建 GLM prompt"""
    relevant_summaries = get_relevant_existing_summaries(candidates, existing_summaries)
    
    candidates_text = ""
    for i, c in enumerate(candidates):
        candidates_text += f"\n---\n候选 #{i}\n"
        candidates_text += f"标题: {c.get('title', '')}\n"
        candidates_text += f"正文摘要: {c.get('glm_content', c.get('content', ''))}\n"
        candidates_text += f"URL: {c.get('url', '')}\n"
        candidates_text += f"语言: {c.get('language', 'unknown')}\n"
    
    existing_text = ""
    if relevant_summaries:
        existing_text = f"""
## 已有来源索引（不要重复收录）
{json.dumps(relevant_summaries, ensure_ascii=False, indent=2)}
请特别注意：如果候选内容和上述已有来源是同一类内容（即使标题不同），请拒绝并标记 reason: "语义重复"。
"""
    
    pending_text = ""
    if pending_titles:
        pending_text = f"""
## 最近待审核候选（避免重复投递）
{json.dumps(pending_titles[:10], ensure_ascii=False, indent=2)}
"""
    
    return f"""你是 AuraClaw 网站的内容质量审核员。

AuraClaw 不是教程百科、Prompt 市场、skill 导航站、AI 新闻搬运站。
AuraClaw 真正需要的是：可改写成来源索引的高价值内容、可改写成经验包的高质量题材、中文用户真实会用到的工作流、可复现可验证可回退的内容线索。

以下是从各个来源抓取的候选内容，请逐一判断：
{candidates_text}
{existing_text}
{pending_text}

## 优先级

**最优先**：中文平台接入工作流、中文部署路径、中文工作流案例、可复现的 examples/scripts/config、一人公司（OPC）工作流、抖音/情报/GitHub 监控/日报周报

**降低优先级**：泛入门介绍、相似学习路径、官方概念页

**严格拒绝**：首页、目录页、纯营销页、英文硬件宣传页、"7天学习"镜像页、与已有内容重复

## 判断要求

- type: "source_note_candidate"（学习路径/来源地图/部署路径/平台接入总览）或 "recipe_candidate"（真实工作流/可复现案例/examples/scripts/config）
- board_fit: 从 care/extension/dialogue/opc 中选
- why_it_matters: 具体说明能补足什么缺口（禁止套话）
- one_line_summary: 内容摘要（禁止标题复写）
- suggested_recipe_title: 像 AuraClaw 站内会出现的题目
- suggested_angle: 具体到怎么改写（禁止"提取可复用的经验"这类空话）
- confidence: high/medium/low

返回 JSON：
{{
  "candidates": [
    {{
      "index": 0,
      "accept": true/false,
      "type": "source_note_candidate 或 recipe_candidate",
      "board_fit": ["care"],
      "why_it_matters": "...",
      "one_line_summary": "...",
      "suggested_recipe_title": "...",
      "suggested_angle": "...",
      "confidence": "high",
      "reject_reason": "如果拒绝，说明原因"
    }}
  ]
}}

**最多接受 3 条，宁缺毋滥。如果没有3条真正高质量的，就只接受1-2条甚至0条。**"""


def _call_glm_raw(prompt: str, model: str, timeout: int) -> Optional[List[Dict[str, Any]]]:
    """底层 GLM API 调用，返回解析后的 JSON 或 None"""
    if not GLM_API_KEY:
        print("  ⚠️  AURACLAW_GLM_API_KEY 未设置")
        return None
    
    try:
        req_data = {"model": model, "messages": [{"role": "user", "content": prompt}], "temperature": 0.3}
        req = urllib.request.Request(
            GLM_API_URL,
            data=json.dumps(req_data).encode('utf-8'),
            headers={"Authorization": f"Bearer {GLM_API_KEY}", "Content-Type": "application/json"}
        )
        
        with urllib.request.urlopen(req, timeout=timeout) as response:
            result = json.loads(response.read().decode('utf-8'))
            content = result['choices'][0]['message']['content']
            
            # 提取 JSON
            code_block_match = re.search(r'```(?:json)?\s*\n?([\s\S]*?)\n?\s*```', content)
            if code_block_match:
                try:
                    return json.loads(code_block_match.group(1).strip())
                except Exception:
                    pass
            
            try:
                return json.loads(content.strip())
            except Exception:
                pass
            
            depth = 0
            start = -1
            for i, ch in enumerate(content):
                if ch == '{':
                    if depth == 0: start = i
                    depth += 1
                elif ch == '}':
                    depth -= 1
                    if depth == 0 and start >= 0:
                        try:
                            return json.loads(content[start:i+1])
                        except Exception:
                            break
            
            print(f"  ✗ GLM JSON 解析失败")
            return None
    
    except Exception as e:
        err_str = str(e)
        if 'timed out' in err_str or 'timeout' in err_str:
            raise TimeoutError(f"GLM {model} 超时 ({timeout}s)")
        raise


def glm_analyze_with_retry(candidates: List[Dict[str, Any]], existing_summaries: List[str],
                           pending_titles: List[str]) -> Dict[str, Any]:
    """
    v5: 带重试 + 降载 + fallback 的 GLM 筛选。
    返回: {
        "status": "success" | "retry_success" | "fallback" | "failed",
        "model_used": str,
        "attempts": int,
        "fallback_mode": str | None,
        "latency_seconds": float,
        "result": List[Dict] | None,
        "error": str | None
    }
    """
    total_latency = 0.0
    attempts = 0
    last_error = None
    
    # 降载梯度：每次尝试缩减候选数和内容长度
    tiers = [
        {"count": 12, "content_len": 300, "timeout": 60, "model": GLM_MODEL_PRIMARY},
        {"count": 8,  "content_len": 200, "timeout": 45, "model": GLM_MODEL_PRIMARY},
        {"count": 5,  "content_len": 150, "timeout": 35, "model": GLM_MODEL_PRIMARY},
        {"count": 8,  "content_len": 200, "timeout": 45, "model": GLM_MODEL_FALLBACK},  # fallback 到 GLM-4.7
    ]
    
    for tier_idx, tier in enumerate(tiers):
        attempts += 1
        model = tier["model"]
        count = min(tier["count"], len(candidates))
        timeout = tier["timeout"]
        content_len = tier["content_len"]
        
        # 准备候选（截断内容）
        sliced = candidates[:count]
        for c in sliced:
            c['glm_content'] = c.get('content', '')[:content_len]
        
        label = f"尝试 {attempts}: {model} top-{count} len-{content_len} timeout-{timeout}s"
        print(f"  🔄 {label}...", end=" ", flush=True)
        
        prompt = _build_glm_prompt(sliced, existing_summaries, pending_titles)
        
        t0 = time.time()
        try:
            result = _call_glm_raw(prompt, model, timeout)
            latency = time.time() - t0
            total_latency += latency
            
            if result and 'candidates' in result:
                # 把结果中的 index 映射回原始候选
                for item in result['candidates']:
                    idx = item.get('index', -1)
                    if 0 <= idx < len(sliced):
                        item['_orig'] = sliced[idx]
                
                status = "success" if tier_idx == 0 else "retry_success"
                print(f"✅ ({latency:.1f}s)")
                return {
                    "status": status,
                    "model_used": model,
                    "attempts": attempts,
                    "fallback_mode": None,
                    "latency_seconds": total_latency,
                    "result": result,
                    "error": None,
                    "sliced_count": count,
                }
            else:
                print(f"⚠️ JSON 无 candidates ({latency:.1f}s)")
                last_error = "GLM 返回 JSON 但无 candidates 字段"
        
        except TimeoutError as e:
            latency = time.time() - t0
            total_latency += latency
            print(f"⏱️ 超时 ({latency:.1f}s)")
            last_error = str(e)
        
        except Exception as e:
            latency = time.time() - t0
            total_latency += latency
            print(f"✗ 错误: {e} ({latency:.1f}s)")
            last_error = str(e)
        
        # 重试间短暂等待
        if tier_idx < len(tiers) - 1:
            time.sleep(2)
    
    # 所有尝试都失败
    return {
        "status": "failed",
        "model_used": GLM_MODEL_PRIMARY,
        "attempts": attempts,
        "fallback_mode": "quality_score_snapshot",
        "latency_seconds": total_latency,
        "result": None,
        "error": last_error,
    }


# ============ 主流程 ============

def main():
    print("=" * 60)
    print("🦞 AuraClaw 内容侦察员 v5")
    print("  GLM-5.1 / 重试+降载+fallback / 接受上限3")
    print("=" * 60)
    
    # 1. 加载去重数据
    print("\n📋 加载去重数据...")
    published_urls, published_titles, published_summaries = load_existing_published_content()
    print(f"  已发布: {len(published_urls)} URL, {len(published_titles)} 标题")
    pending_records = load_pending_review_content()
    pending_titles = [r['title'] for r in pending_records.values() if r.get('title')]
    print(f"  待审核: {len(pending_records)} 条")
    
    # 2. 扫描种子来源
    print("\n📡 扫描种子来源...")
    content_pages = []
    index_pages = []
    scanned_domains = set()
    
    for source_id, source_url in SEED_SOURCES.items():
        domain = urlparse(source_url).netloc
        scanned_domains.add(domain)
        
        if 'github.com' in source_url:
            cands = scrape_github_repo(source_url, max_pages=MAX_PAGES_PER_SITE)
            for c in cands:
                c['source_id'] = source_id
            content_pages.extend(cands)
        else:
            cands, idxs = scrape_website_3layers(source_id, source_url, max_pages=MAX_PAGES_PER_SITE)
            content_pages.extend(cands)
            index_pages.extend(idxs)
    
    print(f"\n✓ 种子来源: {len(content_pages)} 正文页, {len(index_pages)} 目录页")
    
    # 3. #2 + #12: 站外发现（轻量：只抓二级，不递归）
    print("\n🔍 站外来源发现...")
    # 清理 html 字段
    clean_pages = [{k: v for k, v in c.items() if k != 'html'} for c in content_pages]
    discovered_urls = []  # 初始化
    discovered_pages = []
    
    discovered_urls = discover_sources_from_content(clean_pages, scanned_domains)
    
    if discovered_urls:
        print(f"  发现 {len(discovered_urls)} 个新来源:")
        for du in discovered_urls:
            print(f"    → {du}")
            domain = urlparse(du).netloc
            if 'github.com' in du:
                cands = scrape_github_repo(du, max_pages=2)  # 发现来源：只抓2页
                for c in cands:
                    c['source_id'] = f"discovered-{domain}"
                discovered_pages.extend(cands)
            else:
                # 发现来源：只抓首页二级，不递归
                html = fetch_url(du, timeout=5)
                if html:
                    cdata = extract_page_content(html, du)
                    if cdata and cdata.get('title') and is_title_readable(cdata['title']):
                        cdata['source_id'] = f"discovered-{domain}"
                        cdata['crawl_depth'] = 'secondary'
                        cdata['is_content_page'] = True
                        discovered_pages.append(cdata)
        
        content_pages.extend(discovered_pages)
        print(f"  发现型来源新增: {len(discovered_pages)} 条（轻量抓取）")
    
    if not content_pages:
        print("\n⚠️  未找到候选内容")
        return
    
    # 4. 语言过滤
    print("\n🌍 语言检测和过滤...")
    filtered = []
    lang_rejected = 0
    
    for page in content_pages:
        lang = detect_language(f"{page.get('title', '')} {page.get('content', '')}")
        page['language'] = lang
        
        reject, reason = should_reject_english(page.get('url', ''), page.get('title', ''), page.get('content', ''))
        if reject:
            page['reject_reason'] = reason
            lang_rejected += 1
            print(f"  ✗ {reason}: {page.get('title', '')[:50]}")
        else:
            filtered.append(page)
            if lang != 'zh':
                print(f"  ⚠️  {lang}: {page.get('title', '')[:50]}")
    
    print(f"✓ 语言过滤后: {len(filtered)} 条 (拒绝 {lang_rejected})")
    
    # 5. 3层去重
    print("\n🔍 3层去重（URL规范化）...")
    unique = []
    dup_rejected = []
    
    for page in filtered:
        can_url = canonicalize_url(page.get('url', ''))
        page['canonical_url'] = can_url
        
        is_dup, dup_reason, novelty = check_duplicate_3layers(
            page.get('url', ''), page.get('title', ''), page.get('content', ''),
            published_urls, published_titles, published_summaries,
            pending_records, can_url
        )
        
        if is_dup:
            dup_rejected.append({'title': page.get('title', ''), 'source_url': page.get('url', ''), 'reason': dup_reason})
            print(f"  ✗ {dup_reason}: {page.get('title', '')[:50]}")
        else:
            page['novelty_reason'] = novelty
            page['duplicate_check_result'] = "通过"
            unique.append(page)
            print(f"  ✓ {novelty}: {page.get('title', '')[:50]}")
    
    # 高价值目录页
    for page in index_pages:
        is_hp = bool(re.match(r'^https?://[^/]+/?$', page.get('url', '')))
        if is_hp:
            title_clean = clean_text(page.get('title', '')).lower()
            is_dup = any(title_clean in s.lower() or s.lower() in title_clean for s in published_summaries)
            if not is_dup:
                page['novelty_reason'] = "高价值来源索引"
                page['duplicate_check_result'] = "通过"
                page['language'] = detect_language(f"{page.get('title', '')} {page.get('content', '')}")
                page['canonical_url'] = canonicalize_url(page.get('url', ''))
                unique.append(page)
                print(f"  ✓ 高价值索引: {page.get('title', '')[:50]}")
    
    print(f"\n✓ 去重后: {len(unique)} 条唯一候选")
    
    if not unique:
        print("\n⚠️  所有候选均重复")
        return
    
    # 6. #11: 内部质量评分 + 排序
    for c in unique:
        c['scores'] = score_candidate(c)
    unique.sort(key=lambda x: x.get('scores', {}).get('total_score', 0), reverse=True)
    
    # v5: prefiltered 保留 top 10 用于失败快照
    pre_filtered = unique[:12]
    print(f"\n📊 质量评分 top 10:")
    for i, c in enumerate(pre_filtered[:10]):
        s = c.get('scores', {})
        print(f"  {i+1}. [{s.get('total_score', 0):.2f}] {c.get('title', '')[:40]} (lang={c.get('language', '?')})")
    
    # 7. v5: GLM-5.1 语义筛选（带重试 + 降载 + fallback）
    print(f"\n🤖 GLM-5.1 语义筛选（重试 + 降载 + fallback）...")
    glm_outcome = glm_analyze_with_retry(pre_filtered, published_summaries, pending_titles)
    
    glm_status = glm_outcome['status']
    glm_model_used = glm_outcome['model_used']
    glm_attempts = glm_outcome['attempts']
    glm_fallback = glm_outcome['fallback_mode']
    glm_latency = glm_outcome['latency_seconds']
    glm_error = glm_outcome['error']
    glm_result = glm_outcome['result']
    
    print(f"  📋 状态: {glm_status} | 模型: {glm_model_used} | 尝试: {glm_attempts}次 | 耗时: {glm_latency:.1f}s")
    if glm_fallback:
        print(f"  🔄 Fallback: {glm_fallback}")
    
    accepted = []
    rejected = dup_rejected.copy()
    notes = ""
    
    # v5: 构建 prefiltered_candidates 快照（无论成功失败都保留）
    prefiltered_candidates_snapshot = []
    for i, c in enumerate(unique[:10]):
        sid = c.get('source_id', '')
        display_name = SOURCE_DISPLAY_NAMES.get(sid, sid)
        if display_name.startswith("discovered-"):
            display_name = f"发现来源 / {display_name.replace('discovered-', '')}"
        ctype = infer_content_type(c.get('title', ''), c.get('url', ''), c.get('content', ''))
        prefiltered_candidates_snapshot.append({
            'rank': i + 1,
            'title': c.get('title', ''),
            'source_name': display_name,
            'source_url': c.get('url', ''),
            'canonical_url': c.get('canonical_url', ''),
            'content_type': ctype,
            'board_fit_guess': infer_board_fit(c.get('title', ''), c.get('content', '')),
            'quality_scores': c.get('scores', {}),
            'novelty_reason': c.get('novelty_reason', ''),
            'crawl_depth': c.get('crawl_depth', 'unknown'),
            'language': c.get('language', 'unknown'),
        })
    
    if glm_status in ('success', 'retry_success') and glm_result:
        sliced_count = glm_outcome.get('sliced_count', len(pre_filtered))
        for item in glm_result.get('candidates', []):
            if len(accepted) >= 3:
                break
            
            idx = item.get('index', 0)
            if idx >= sliced_count:
                continue
            
            # 找回原始候选
            orig = item.get('_orig', pre_filtered[idx] if idx < len(pre_filtered) else None)
            if not orig:
                continue
            
            if item.get('accept', False):
                sid = orig.get('source_id', '')
                display_name = SOURCE_DISPLAY_NAMES.get(sid, sid)
                if display_name.startswith("discovered-"):
                    display_name = f"发现来源 / {display_name.replace('discovered-', '')}"
                ctype = infer_content_type(orig.get('title', ''), orig.get('url', ''), orig.get('content', ''))
                
                accepted.append({
                    'id': f'CAND-{len(accepted):03d}',
                    'type': item.get('type', 'source_note_candidate'),
                    'title': orig.get('title', ''),
                    'source_name': display_name,
                    'source_url': orig.get('url', ''),
                    'canonical_url': orig.get('canonical_url', ''),
                    'content_type': ctype,
                    'board_fit': item.get('board_fit', ['care']),
                    'why_it_matters': item.get('why_it_matters', ''),
                    'one_line_summary': item.get('one_line_summary', ''),
                    'suggested_recipe_title': item.get('suggested_recipe_title', ''),
                    'suggested_angle': item.get('suggested_angle', ''),
                    'confidence': item.get('confidence', 'medium'),
                    'novelty_reason': orig.get('novelty_reason', ''),
                    'duplicate_check_result': orig.get('duplicate_check_result', '通过'),
                    'crawl_depth': orig.get('crawl_depth', 'unknown'),
                    'language': orig.get('language', 'unknown'),
                    'needs_manual_review': True
                })
            else:
                rejected.append({
                    'title': orig.get('title', ''),
                    'source_url': orig.get('url', ''),
                    'reason': item.get('reject_reason', 'GLM 判定不适合'),
                    'language': orig.get('language', 'unknown')
                })
        
        print(f"  ✓ GLM 筛选: 接受 {len(accepted)} 条, 拒绝 {len(rejected) - len(dup_rejected)} 条")
        notes = f"GLM {glm_model_used} {glm_status}，{len(unique)} → {len(accepted)} 条（{glm_attempts}次尝试）"
    else:
        print(f"  ⚠️  GLM 失败（{glm_attempts}次尝试）: {glm_error}")
        print(f"  📦 已保留 {len(prefiltered_candidates_snapshot)} 条 prefiltered_candidates 供人工审核")
        notes = f"GLM 失败: {glm_error}（{glm_attempts}次尝试，fallback={glm_fallback}）"
    
    # 8. 生成 YAML
    print("\n📝 生成 YAML...")
    now = datetime.now()
    timestamp = now.strftime("%Y-%m-%d_%H%M")
    output_path = HARVEST_DIR / f"{timestamp}.yaml"
    
    output = {
        'run_at': now.isoformat(),
        'collector': 'auraclaw-scout-v5',
        'status': 'completed',
        'focus_theme': 'OpenClaw 中文生态 / 能力扩展 / 平台接入 / OPC',
        'save_path': str(output_path),
        # v5: 筛选稳定性指标
        'glm_status': glm_status,
        'glm_model_used': glm_model_used,
        'glm_attempts': glm_attempts,
        'glm_latency_seconds': round(glm_latency, 1),
        'glm_error': glm_error,
        'glm_fallback_mode': glm_fallback,
        'summary': {
            'scanned_sources_count': len(SEED_SOURCES),
            'discovered_sources_count': len(discovered_urls),
            'discovered_sources_sample': discovered_urls[:5],
            'content_pages_count': len(content_pages),
            'language_filtered_count': lang_rejected,
            'duplicates_rejected_count': len(dup_rejected),
            'unique_candidates_count': len(unique),
            'accepted_candidates_count': len(accepted),
            'rejected_candidates_count': len(rejected),
            'prefiltered_candidates_count': len(prefiltered_candidates_snapshot),
            'notes': notes,
        },
        'accepted_candidates': accepted,
        'rejected_candidates': rejected[:15],
        # v5: 失败时保留候选快照
        'prefiltered_candidates': prefiltered_candidates_snapshot if glm_status == 'failed' else [],
        'next_actions': [
            '审查 accepted_candidates',
            '检查 novelty_reason 和 duplicate_check_result',
            '选择高质量条目改写成 source-note 或 recipe',
        ]
    }
    
    HARVEST_DIR.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        yaml.dump(output, f, allow_unicode=True, default_flow_style=False, sort_keys=False)
    
    print(f"  ✓ 已保存: {output_path}")
    
    # 9. 摘要
    print("\n" + "=" * 60)
    print("📊 执行摘要")
    print("=" * 60)
    print(f"保存路径: {output_path}")
    print(f"GLM 状态: {glm_status} | 模型: {glm_model_used} | 尝试: {glm_attempts}次 | 耗时: {glm_latency:.1f}s")
    if glm_fallback:
        print(f"Fallback: {glm_fallback}")
    print(f"接受: {len(accepted)} 条 (上限 3)")
    print(f"拒绝: {len(rejected)} 条")
    print(f"预筛候选: {len(prefiltered_candidates_snapshot)} 条")
    print(f"站外发现: {len(discovered_urls)} 个新来源")
    
    if rejected:
        from collections import Counter
        reasons = Counter(r.get('reason', 'unknown') for r in rejected)
        most_common = reasons.most_common(1)[0]
        print(f"最常见拒绝原因: {most_common[0]} ({most_common[1]} 次)")
    
    tertiary = [c for c in content_pages if c.get('crawl_depth') == 'tertiary']
    print(f"深层页面(tertiary): {len(tertiary)} 条")
    
    if accepted:
        print(f"\n🔥 最值得优先审核的 {len(accepted)} 条:")
        for i, best in enumerate(accepted):
            print(f"\n  [{i+1}] {best.get('title', '')}")
            print(f"      来源: {best.get('source_name', '')}")
            print(f"      类型: {best.get('type', '')} / {best.get('content_type', '')}")
            print(f"      板块: {best.get('board_fit', [])}")
            print(f"      语言: {best.get('language', '')} | 深度: {best.get('crawl_depth', '')}")
            print(f"      新颖性: {best.get('novelty_reason', '')}")
            print(f"      改写方向: {best.get('suggested_angle', '')[:80]}...")
    elif prefiltered_candidates_snapshot:
        print(f"\n📋 GLM 失败，以下是内部评分最高的候选（供人工审核）:")
        for i, pc in enumerate(prefiltered_candidates_snapshot[:3]):
            s = pc.get('quality_scores', {})
            print(f"\n  [{i+1}] {pc.get('title', '')} [{s.get('total_score', 0):.2f}]")
            print(f"      来源: {pc.get('source_name', '')}")
            print(f"      类型: {pc.get('content_type', '')} | 板块: {pc.get('board_fit_guess', '')}")
            print(f"      语言: {pc.get('language', '')} | 深度: {pc.get('crawl_depth', '')}")
            print(f"      新颖性: {pc.get('novelty_reason', '')}")
    else:
        print("\n⚠️  本轮未发现高质量候选")
    
    print("\n" + "=" * 60)
    print("✅ 执行完成")
    print("=" * 60)


if __name__ == "__main__":
    import signal
    
    def handler(signum, frame):
        print("\n⏰ 全局超时（5分钟），强制退出")
        import sys; sys.exit(1)
    
    signal.signal(signal.SIGALRM, handler)
    signal.alarm(300)  # 5 分钟全局超时
    
    main()
