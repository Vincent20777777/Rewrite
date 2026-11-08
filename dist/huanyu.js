// 幻宇星球 VIP 解锁 - 本地优化版
// 适配 hyxq04.com 等新域名

const WORKER = "https://huanyu-proxy.daoyufan.workers.dev";

const url = $request.url;
const method = ($request.method || "GET").toLowerCase();

const match = url.match(/^https?:\/\/([^\/?#]+)(\/[^?#]*)?(\?.*)?/);

if (!match) {
  $done({});
} else {
  const originalHost = match[1];
  const path = match[2] || "/";
  const query = match[3] || "";
  const targetUrl = WORKER + path + query;

  // 复制请求头，保留关键信息
  const headers = {};
  const orig = $request.headers || {};

  for (const k in orig) {
    const lk = k.toLowerCase();
    // 跳过这些头
    if (lk === "host" || lk === "content-length" || lk === "connection") continue;
    headers[k] = orig[k];
  }

  // 关键：把原始 Host 通过自定义头传给 Worker
  headers["X-Original-Host"] = originalHost;
  headers["X-Forwarded-Host"] = originalHost;
  headers["Referer"] = "https://" + originalHost + "/";

  const options = {
    url: targetUrl,
    headers: headers,
    timeout: 20000,
    "binary-mode": true
  };

  if ($request.body) {
    options.body = $request.body;
  }

  const fn = $httpClient[method] || $httpClient.get;

  fn(options, function (error, response, data) {
    if (error) {
      console.log("幻宇星球代理错误: " + error);
      $done({ response: { status: 502, body: "Proxy Error: " + error } });
      return;
    }

    const resp = response || {};
    const code = resp.status || 200;
    const h = resp.headers || {};
    const out = {};

    for (const k in h) {
      if (!/^(content-encoding|content-length|transfer-encoding)$/i.test(k)) {
        out[k] = h[k];
      }
    }

    $done({
      response: {
        status: code,
        headers: out,
        body: data
      }
    });
  });
}
