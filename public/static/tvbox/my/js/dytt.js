// dytt.js — 电影天堂资源（maccms 采集接口）QuickJS 爬虫
// 采集地址：https://caiji.dyttzyapi.com/api.php/provide/vod
// Site 配置示例：
// { "key": "dytt", "name": "电影天堂", "type": 3, "api": "./dytt.js", "ext": {} }

const BASE_URL = "https://caiji.dyttzyapi.com/api.php/provide/vod";

const UA = "Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/122.0.6261.119 Mobile Safari/537.36";

// 静态筛选数据：地区
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

// 静态筛选数据：年份（按当前年份动态生成近 22 年）
function buildYearValues() {
  const nowYear = new Date().getFullYear();
  const years = [{ n: "全部", v: "" }];
  for (let y = nowYear; y >= nowYear - 21; y--) {
    years.push({ n: String(y), v: String(y) });
  }
  return years;
}

// 发起 GET 请求并解析 JSON
function getJson(url) {
  const res = req(url, {
    method: "GET",
    headers: { "User-Agent": UA },
  });
  try {
    return JSON.parse(res.content);
  } catch (e) {
    return {};
  }
}

// 拉取采集站 class 数组（含一级、二级分类）
function fetchClasses() {
  const data = getJson(`${BASE_URL}?ac=list`);
  return data.class || [];
}

// 由 class 组装：一级分类列表 + 每个一级分类下的二级分类
// type_pid 为 0 的是一级分类，不为 0 的是二级分类
function buildTree(allClasses) {
  const tops = allClasses.filter((c) => Number(c.type_pid) === 0);
  const tree = tops.map((top) => ({
    type_id: top.type_id,
    type_name: top.type_name,
    children: allClasses.filter((c) => Number(c.type_pid) === Number(top.type_id)),
  }));
  return tree;
}

// 清理简介中的 HTML 标签与空白
function cleanText(str) {
  if (!str) return "";
  return String(str)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

// 采集卡片字段 → CatVod Vod 字段
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
    vod_content: cleanText(item.vod_blurb || item.vod_content),
  };
}

// 拼接列表/搜索请求
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

  // 首页：从采集地址获取 class，type_pid=0 作为一级分类；
  // 二级分类、地区、年份组装为 filters
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
        // 二级分类选项：全部 = 聚合该一级分类下所有二级分类 id
        const classValues = [
          { n: "全部", v: top.children.map((c) => c.type_id).join(",") },
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
    return JSON.stringify({ list: (data.list || []).map(toVod) });
  },

  // 分类：tid 为一级分类 id；extend.t 为选中的二级分类 id（多个逗号分隔）
  category(tid, pg, filter, extend) {
    const tree = buildTree(fetchClasses());
    const top = tree.find((c) => String(c.type_id) === String(tid));
    // 未选二级分类时，聚合该一级分类下全部二级分类 id
    let typeIds = extend && extend.t;
    if (!typeIds && top) {
      typeIds = top.children.length
        ? top.children.map((c) => c.type_id).join(",")
        : String(top.type_id);
    }
    const data = getJson(
      buildListUrl({
        t: typeIds,
        pg: pg,
        area: extend && extend.area,
        year: extend && extend.year,
      })
    );
    return JSON.stringify({
      list: (data.list || []).map(toVod),
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
    // maccms 的播放分组与集数格式（$$$ / # / $）与 CatVod 一致，直接透传
    vod.vod_play_from = item.vod_play_from || "";
    vod.vod_play_url = item.vod_play_url || "";
    vod.vod_content = cleanText(item.vod_content);
    vod.vod_lang = item.vod_lang || "";
    return JSON.stringify({ list: [vod] });
  },

  search(wd, quick, pg) {
    const data = getJson(buildListUrl({ wd: wd, pg: pg || 1 }));
    return JSON.stringify({
      list: (data.list || []).map(toVod),
      pagecount: Number(data.pagecount) || 0,
    });
  },

  // 播放：m3u8 直链直接回传；share 链接需走解析
  play(flag, id, vipFlags) {
    if (id.indexOf(".m3u8") > -1 || id.indexOf(".mp4") > -1) {
      return JSON.stringify({
        parse: 0,
        playUrl: "",
        url: id,
        header: { "User-Agent": UA, Referer: "https://www.dyttzy.com/" },
      });
    }
    // 需第三方解析的线路（如 /share/ 页面链接）
    return JSON.stringify({
      parse: 1,
      jx: 1,
      playUrl: "",
      url: id,
      header: { "User-Agent": UA },
    }); 
  },

  destroy() {},
};
