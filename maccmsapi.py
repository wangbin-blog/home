import json
import re
import os
import random
import requests
from Crypto.Cipher import AES
from base64 import b64decode

# ==========配置==========
CLOUD_API_URL = "https://api.maccms.ai/sites.json"
CLOUD_ENCRYPT_KEY = b"maccms_rh_2024_s3cr3t_k3y!@#$%^&"

base_template = {
    "spider": "",
    "wallpaper": "https://www.dmoe.cc/random.php",
    "sites": [],
    "parses": [
        {
            "name": "Json并发",
            "type": 2,
            "url": "Parallel"
        },
        {
            "name": "pangujiexi解析",
            "type": 2,
            "url": "shturl.cc/AzImUezun2WZxD8qCVcBBBXKBsSY",
            "ext": {
                "flag": ["qiyi","qq","letv","sohu","youku","mgtv","bilibili","wasu","xigua","1905"]
            }
        },
        {
            "name": "ckplayer解析",
            "type": 1,
            "url": "https://www.ckplayer.vip/jiexi/?url=",
            "ext": {
                "flag": ["qiyi","qq","letv","sohu","youku","mgtv","bilibili","wasu","xigua","1905"]
            }
        }
    ],
    "flags": [
        "youku","qq","iqiyi","qiyi","letv","sohu","tudou","pptv","mgtv","wasu","bilibili","le","duoduozy","renrenmi","xigua",
        "优酷","腾讯","爱奇艺","奇艺","乐视","搜狐","土豆","PPTV","芒果","华数","哔哩","1905"
    ],
    "lives": [
        {
            "name": "咪咕直播",
            "type": 0,
            "url": "https://gh-proxy.com/https://raw.githubusercontent.com/develop202/migu_video/refs/heads/main/interface.txt",
            "epg": "http://epg.51zmt.top:8000/api/diyp/?ch={name}&date={date}",
            "logo": "https://live.fanmingming.com/tv/{name}.png"
        },
        {
            "name": "直播二",
            "type": 0,
            "url": "https://gh-proxy.org/https://raw.githubusercontent.com/cqshushu/tvjk/main/all.txt",
            "epg": "http://epg.51zmt.top:8000/api/diyp/?ch={name}&date={date}",
            "logo": "https://live.fanmingming.com/tv/{name}.png"
        },
        {
            "name": "直播三",
            "type": 0,
            "url": "https://live.zbds.top/tv/iptv4.txt",
            "epg": "http://epg.51zmt.top:8000/api/diyp/?ch={name}&date={date}",
            "logo": "https://live.fanmingming.com/tv/{name}.png"
        }
    ],
    "ads": [
        "mimg.0c1q0l.cn","www.googletagmanager.com","www.google-analytics.com","mc.usihnbcq.cn","mg.g1mm3d.cn","mscs.svaeuzh.cn","cnzz.hhurm.com","tp.vinuxhome.com","cnzz.mmstat.com","shturl.cc/0PuzZba","s23.cnzz.com","z3.cnzz.com","c.cnzz.com","stj.v1vo.top","z12.cnzz.com","img.mosflower.cn","tips.gamevvip.com","ehwe.yhdtns.com","xdn.cqqc3.com","www.jixunkyy.cn","sp.chemacid.cn","hm.baidu.com","s9.cnzz.com","z6.cnzz.com","um.cavuc.com","mav.mavuz.com","wofwk.aoidf3.com","z5.cnzz.com","xc.hubeijieshikj.cn","tj.tianwenhu.com","xg.gars57.cn","k.jinxiuzhilv.com","cdn.bootcss.com","ppl.xunzhuo123.com","xomk.jiangjunmh.top","img.xunzhuo123.com","z1.cnzz.com","s13.cnzz.com","xg.huataisangao.cn","z7.cnzz.com","xg.huataisangao.cn","z2.cnzz.com","s96.cnzz.com","q11.cnzz.com","thy.dacedsfa.cn","xg.whsbpw.cn","s19.cnzz.com","z8.cnzz.com","s4.cnzz.com","f5w.as12df.top","ae01.alicdn.com","www.92424.cn","k.wudejia.com","vivovip.mmszxc.top","qiu.xixiqiu.com","cdnjs.hnfenxun.com","cms.qdwght.com"
    ]
}


def generateSiteKey(name: str) -> str:
    s = re.sub(r'[^\da-zA-Z]', '', name)
    s = s.lower().strip()
    if not s:
        s = f"site_{random.randint(1000,9999)}"
    return s


def aes256_cbc_decrypt(cipher_b64: str, iv_b64: str, key: bytes) -> str:
    cipher_data = b64decode(cipher_b64)
    iv = b64decode(iv_b64)
    cipher = AES.new(key, AES.MODE_CBC, iv)
    plain = cipher.decrypt(cipher_data)
    pad_len = plain[-1]
    plain = plain[:-pad_len]
    return plain.decode("utf-8")


def main():
    print(f"Fetch: {CLOUD_API_URL}")
    resp = requests.get(CLOUD_API_URL, timeout=15)
    resp.raise_for_status()
    payload = json.loads(resp.text)

    if "data" not in payload or "iv" not in payload:
        raise Exception("远端数据格式错误，缺少 data / iv")

    decrypted_text = aes256_cbc_decrypt(payload["data"], payload["iv"], CLOUD_ENCRYPT_KEY)
    sourceSites = json.loads(decrypted_text)

    # 校验字段
    for item in sourceSites:
        for k in ("name", "url", "category"):
            if k not in item:
                raise Exception(f"源数据缺失字段:{k}")

    outSites = []
    groupByCategory = {}

    for item in sourceSites:
        row = {
            "key": generateSiteKey(item["name"]),
            "name": item["name"],
            "type": 1,
            "api": item["url"],
            "searchable": 1,
            "quickSearch": 1,
            "filterable": 1,
            "ext": "",
            "timeout": 10,
            "categories": []
        }
        outSites.append(row)
        cat = item.get("category", "default")
        if cat not in groupByCategory:
            groupByCategory[cat] = []
        groupByCategory[cat].append(row)


    # 输出分类拆分 output/*.json
    out_dir = "public/static/tvbox/maccms"
    os.makedirs(out_dir, exist_ok=True)
    for catName, siteList in groupByCategory.items():
        safeName = re.sub(r'[\/\\:*?"<>|]', '_', catName)
        outFile = os.path.join(out_dir, f"{safeName}.json")
        with open(outFile, "w", encoding="utf-8") as f:
            json.dump(siteList, f, ensure_ascii=False, indent=2)
        print(f"生成: {outFile}")


if __name__ == "__main__":
    main()