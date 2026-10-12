// dytt.js — 电影天堂资源 maccms采集 QuickJS (type:4)
// site配置: {"key":"dytt","name":"电影天堂","type":4,"api":"./dytt.js","ext":{}}
const BASE_URL = "https://caiji.dyttzyapi.com/api.php/provide/vod";
const UA = "Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/122.0.6261.119 Mobile Safari/537.36";

// 静态筛选 地区
const AREA_VALUES = [
  { n: "全部", v: "" },
  { n: "中国大陆", v: "中国大陆" },
  { n: "香港", v: "香港" },
  { n: "台湾", v: "台湾" },
  { n: "美国", v: "美国" },
  { n: "英国", v: "英国" },
  { n: "日本", v: "日本" },
  { n: "韩国", v: "韩国" },
  { n: "印度", v: "印度" },
  { n: "泰国", v: "泰国" },
  { n: "新加坡", v: "新加坡" },
  { n: "马来西亚", v: "马来西亚" },
  { n: "法国", v: "法国" },
  { n: "加拿大", v: "加拿大" },
  { n: "澳大利亚", v: "澳大利亚" },
  { n: "其他", v: "其他" },
];

// 年份
function buildYearValues() {
  try {
    const nowYear = new Date().getFullYear();
    const years = [{ n: "全部", v: "" }];
    for (let y = nowYear; y >= nowYear - 21; y--) {
      years.push({ n: String(y), v: String(y) });
    }
    return years;
  }catch(e){
    log("年份生成异常"+e);
    return [{n:"全部",v:""}];
  }
}

// 请求+json解析 增加全局try
function getJson(url) {
  try {
    log("req:"+url);
    const res = req(url, {
      method: "GET",
      headers: { "User-Agent": UA },
    });
    return JSON.parse(res.content);
  } catch (e) {
    log("请求失败: " + url + " err:" + e);
    return {};
  }
}

// 获取分类
function fetchClasses() {
  const data = getJson(`${BASE_URL}?ac=list`);
  return data.class || [];
}

// 构建分类树
function buildTree(allClasses) {
  const tops = allClasses.filter((c) => Number(c.type_pid) === 0);
  const tree = tops.map((top) => ({
    type_id: top.type_id,
    type_name: top.type_name,
    children: allClasses.filter((c) => Number(c.type_pid) === Number(top.type_id)),
  }));
  return tree;
}

// 清理简介
function cleanText(str) {
  if (!str) return "";
  return String(str)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

// 转为vod结构
function toVod(item) {
  return {
    vod_id: String(item.vod_id),
    vod_name: item.vod_name || "",
    vod_pic: item.vod_pic || "",
    vod_remarks: item.vod_remarks || "",
    type_name: item.type_name || "",
    vod_year: item.vod_year || "",
    vod_area: item.vod_area || "",
    vod_actor: item.vod_actor || "",
    vod_director: item.vod_director || "",
    vod_content: cleanText(item.vod_content || item.vod_blurb),
  };
}

// 拼接url参数
function buildListUrl(params) {
  const q = ["ac=videolist"];
  Object.keys(params).forEach((k) => {
    const v = params[k];
    if (v !== undefined && v !== null && String(v) !== "") {
      q.push(`${k}=${encodeURIComponent(v)}`);
    }
  });
  return `${BASE_URL}?${q.join("&")}`;
}

export default {
  init(ext) {
    this.ext = ext;
  },
  home(filter) {
    const tree = buildTree(fetchClasses());
    const classes = [];
    const filters = {};
    tree.forEach((top) => {
      classes.push({
        type_id: String(top.type_id),
        type_name: top.type_name,
      });
      if (filter) {
        // 修复：去掉逗号多ID，全部单选，全部传空
        const classValues = [
          { n: "全部", v: "" },
          ...top.children.map((c) => ({ n: c.type_name, v: String(c.type_id) })),
        ];
        filters[String(top.type_id)] = [
          { key: "t", name: "分类", value: classValues },
          { key: "area", name: "地区", value: AREA_VALUES },
          { key: "year", name: "年份", value: buildYearValues() },
        ];
      }
    });
    return JSON.stringify({
      class: classes,
      filters: filter ? filters : {},
    });
  },
  homeVod() {
    const data = getJson(buildListUrl({ pg: 1 }));
    const list = data.list || [];
    return JSON.stringify({ list: list.map(toVod) });
  },
  category(tid, pg, filter, extend) {
    const tree = buildTree(fetchClasses());
    const top = tree.find((c) => String(c.type_id) === String(tid));
    let typeIds = extend && extend.t;
    // 修复：没选二级分类则t为空，而不是拼接逗号ID
    if (!typeIds && top) {
      typeIds = "";
    }
    const data = getJson(
      buildListUrl({
        t: typeIds,
        pg: pg,
        area: extend && extend.area,
        year: extend && extend.year,
      })
    );
    const list = data.list || [];
    return JSON.stringify({
      list: list.map(toVod),
      page: Number(data.page) || Number(pg) || 1,
      pagecount: Number(data.pagecount) || 0,
      limit: Number(data.limit) || 20,
      total: Number(data.total) || 0,
    });
  },
  detail(ids) {
    const id = Array.isArray(ids) ? ids[0] : ids;
    const data = getJson(buildListUrl({ ids: id }));
    const item = (data.list || [])[0];
    if (!item) return JSON.stringify({ list: [] });
    const vod = toVod(item);
    vod.vod_play_from = item.vod_play_from || "";
    vod.vod_play_url = item.vod_play_url || "";
    vod.vod_lang = item.vod_lang || "";
    return JSON.stringify({ list: [vod] });
  },
  search(wd, quick, pg) {
    const data = getJson(buildListUrl({ wd: wd, pg: pg || 1 }));
    const list = data.list || [];
    return JSON.stringify({
      list: list.map(toVod),
      pagecount: Number(data.pagecount) || 0,
    });
  },
  play(flag, id, vipFlags) {
    if (id.indexOf(".m3u8") > -1 || id.indexOf(".mp4") > -1) {
      return JSON.stringify({
        parse: 0,
        url: id,
        header: { "User-Agent": UA, Referer: "https://www.dyttzy.com/" },
      });
    }
    return JSON.stringify({
      parse: 1,
      url: id,
      header: { "User-Agent": UA },
    });
  },
  destroy() {},
};
