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
        cat = item.get("category", "default")
        if cat not in groupByCategory:
            groupByCategory[cat] = []
        groupByCategory[cat].append(row)

    # 输出路径 public/static/tvbox/maccms，只输出分类json
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