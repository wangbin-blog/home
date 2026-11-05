/*
* @File     : feifan2.js
* @Author   : jade
* @Date     : 2024/02/06 14:58
* @Email    : jadehh@1ive.com
* @Software : Samples
* @Desc     : 非凡资源(一级分类+二级分类筛选版)
*             首页分类展示一级分类(type_pid=0)，每个分类下通过筛选栏选择二级子分类(type_pid=父分类id)
*/

import {VodSpider} from "./vodSpider.js";

class FeiFanV2Spider extends VodSpider {
    constructor() {
        super();
        this.siteUrl = "http://cj.ffzyapi.com"
        this.remove18 = true
        this.type_id_18 = 34
    }

    getAppName() {
        return "非凡资源二筛"
    }

    getName() {
        return `🥗┃非凡资源二筛┃🥗`
    }

    getJSName() {
        return "feifan2"
    }

    getType() {
        return 3
    }

    async spiderInit(inReq) {
        await super.spiderInit(inReq);
    }


    async init(cfg) {
        await super.init(cfg);
        await this.spiderInit(null)

    }

    /**
     * 首页一级分类: 只取 type_pid === 0 的根分类
     * 伦理片一级分类整体排除 (remove18)
     */
    async setClasses() {
        let content = await this.fetch(this.siteUrl + "/api.php/provide/vod/from", {"ac": "list"}, this.getHeader())
        let content_json = JSON.parse(content)
        this.allClassList = content_json["class"]
        // 「最近更新」放在首位, 不依赖 ext.box 是否为 CatOpen, 保证 TVBox/XMBox 下都显示
        if (!this.classes.some(class_dic => class_dic["type_id"] === "最近更新")) {
            this.classes.push(this.getTypeDic("最近更新", "最近更新"))
        }
        for (const class_dic of this.allClassList) {
            if (class_dic["type_pid"].toString() === "0" && class_dic["type_name"] !== this.type_name_18) {
                this.classes.push(this.getTypeDic(class_dic["type_name"], class_dic["type_id"].toString()))
            }
        }
    }

    /**
     * 二级分类筛选: 为每个一级分类挂载其子分类 (type_pid === 一级分类的type_id)
     * "全部" 使用一级分类自身的 type_id 直接查询 (站点接口支持按父分类tid聚合查询)
     */
    async setFilterObj() {
        for (const root_class_dic of this.classes) {
            let type_id = root_class_dic["type_id"].toString()
            let extend_dic = {"key": "1", "name": "分类", "value": [this.getFliterDic("全部", type_id)]}
            for (const class_dic of this.allClassList) {
                if (this.remove18 && class_dic["type_id"].toString() === this.type_id_18.toString()) {
                    continue
                }
                if (class_dic["type_pid"].toString() === type_id) {
                    extend_dic["value"].push(this.getFliterDic(class_dic["type_name"], class_dic["type_id"].toString()))
                }
            }
            this.filterObj[type_id] = [extend_dic]
        }
    }
}

let spider = new FeiFanV2Spider()

async function init(cfg) {
    await spider.init(cfg)
}

async function home(filter) {
    return await spider.home(filter)
}

async function homeVod() {
    return await spider.homeVod()
}

async function category(tid, pg, filter, extend) {
    return await spider.category(tid, pg, filter, extend)
}

async function detail(id) {
    return await spider.detail(id)
}

async function play(flag, id, flags) {
    return await spider.play(flag, id, flags)
}

async function search(wd, quick) {
    return await spider.search(wd, quick)
}

async function proxy(segments, headers) {
    return await spider.proxy(segments, headers)
}

export function __jsEvalReturn() {
    return {
        init: init,
        home: home,
        homeVod: homeVod,
        category: category,
        detail: detail,
        play: play,
        search: search,
        proxy: proxy
    };
}

export {spider}
