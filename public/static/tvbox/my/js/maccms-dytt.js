/**
 * Drpy2 苹果CMS采集接口脚本
 * 接口地址：https://caiji.dyttzyapi.com/api.php/provide/vod
 * 功能：动态加载分类 + 静态筛选(年份2000后、地区、完结状态) + 列表/搜索/详情/播放
 * 适配：影视仓(CatVod) type3 drpy2
 */
const API_BASE = "https://caiji.dyttzyapi.com/api.php/provide/vod";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// ========== 静态筛选配置（你要的硬编码筛选数据） ==========
const filterYearList = [];
for(let y=2026;y>=2000;y--){
    filterYearList.push({"n":y+"","v":y+""});
}
const filterAreaList = [
    {"n":"全部地区","v":""},
    {"n":"大陆","v":"大陆"},
    {"n":"香港","v":"香港"},
    {"n":"台湾","v":"台湾"},
    {"n":"欧美","v":"欧美"},
    {"n":"日韩","v":"日韩"},
    {"n":"东南亚","v":"东南亚"},
    {"n":"其他","v":"其他"}
];
const filterIsEndList = [
    {"n":"全部状态","v":""},
    {"n":"完结","v":"1"},
    {"n":"连载","v":"0"}
];

// 筛选面板定义
const filters = {
    "year":filterYearList,
    "area":filterAreaList,
    "isend":filterIsEndList
}

/**
 * 获取分类（动态请求接口拉取class）
 */
async function getClass() {
    let res = await fetch(API_BASE,{headers:{"User-Agent":UA}});
    let json = await res.json();
    let classes = json.class;
    let ret = [];
    for(let item of classes){
        ret.push({
            "type_id":item.type_id,
            "type_name":item.type_name
        })
    }
    return JSON.stringify({
        "class":ret,
        "filters":filters
    });
}

/**
 * 影片列表（带多条件筛选）
 * @param {Object} args 参数: cate分类id,pg页码,year,area,isend
 */
async function getVodList(args) {
    let cate = args.cate || "";
    let pg = args.pg || 1;
    let year = args.year || "";
    let area = args.area || "";
    let isend = args.isend || "";

    let url = `${API_BASE}?ac=list&pg=${pg}`;
    if(cate) url += `&t=${cate}`;
    if(year) url += `&year=${year}`;
    if(area) url += `&area=${encodeURIComponent(area)}`;
    if(isend) url += `&isend=${isend}`;

    let resp = await fetch(url,{headers:{"User-Agent":UA}});
    let data = await resp.json();
    return JSON.stringify(data);
}

/**
 * 详情页
 * @param {Object} args args.ids
 */
async function getVodDetail(args) {
    let ids = args.ids;
    let url = `${API_BASE}?ac=detail&ids=${ids}`;
    let resp = await fetch(url,{headers:{"User-Agent":UA}});
    let data = await resp.json();
    return JSON.stringify(data);
}

/**
 * 搜索
 * @param {Object} args args.wd关键词 args.pg页码
 */
async function searchVod(args) {
    let wd = args.wd;
    let pg = args.pg || 1;
    let url = `${API_BASE}?ac=search&wd=${encodeURIComponent(wd)}&pg=${pg}`;
    let resp = await fetch(url,{headers:{"User-Agent":UA}});
    let data = await resp.json();
    return JSON.stringify(data);
}

// Drpy2 导出入口
globalThis.get = async function(args){
    let type = args.type;
    switch(type){
        case "class":
            return await getClass();
        case "list":
            return await getVodList(args);
        case "detail":
            return await getVodDetail(args);
        case "search":
            return await searchVod(args);
        default:
            return "{}";
    }
}