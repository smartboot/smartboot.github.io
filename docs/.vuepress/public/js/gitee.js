if (typeof window !== "undefined") {
  client_id = "df82f8c4251350869fff94fb5395c580fc518956165ee82ada04308c6ff16c23";
  client_secret = "a12f46c9eb633ad46b1f3bf845e2c6017705b62e16258f3ca05f51e4a03a9945";
  const gitee_redirect_uri = location.origin;

  function redirect() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    if (code != null) {
      fetch("https://gitee.com/oauth/token?grant_type=authorization_code&code=" + code + "&client_id=" + client_id + "&redirect_uri=" + gitee_redirect_uri + "&client_secret=" + client_secret, {
        method: "POST"
      })
        .then(response => response.text())
        .then(result => {
          resp = JSON.parse(result);
          console.log("result", resp);
          if (resp.access_token != null) {
            //获取用户信息
            localStorage.removeItem("gitee_user");
            const token = resp.access_token;
            fetch("https://gitee.com/api/v5/user?access_token=" + token, {
              method: "GET"
            }).then(response => response.text())
              .then(result => {
                resp = JSON.parse(result);
                console.log("result", resp);
                localStorage.setItem("access_token", token);
                localStorage.setItem("gitee_user", result);
                window.location.href = state + "?timestamp=" + Date.now();
              });

          } else if ("invalid_grant_accessibility" == resp.error) {
            window.location.href = "https://gitee.com/oauth/authorize?client_id=" + client_id + "&redirect_uri=" + gitee_redirect_uri + "&response_type=code";
          }
        })
        .catch(error => console.error(error));
    }
  }

  function getUserInfo() {
    let access_token = checkAccessToken();
    if (access_token == null) {
      return;
    }
    let user = localStorage.getItem("gitee_user");
    if (user != null) {
      return JSON.parse(user);
    }
  }

  function checkAccessToken() {
    let access_token = localStorage.getItem("access_token");
    console.log("access_token", access_token);
    if (access_token == null) {
      window.location.href = "https://gitee.com/oauth/authorize?client_id=" + client_id + "&redirect_uri=" + gitee_redirect_uri + "&response_type=code&state=" + location.href;
      return null;
    } else {
      return access_token;
    }
  }

  function checkStar(owner, repo, failCallback) {
    //文档首页不校验
    if (location.pathname === repo || location.pathname === repo + "/") {
      return;
    }
    let access_token = checkAccessToken();
    if (access_token == null) {
      return;
    }
    fetch("https://gitee.com/api/v5/user/starred/" + owner + "/" + repo + "?access_token=" + access_token, {
      method: "GET"
    })
      .then(response => {
        console.log("check result", response);
        if (response.status == 204) {
        } else if (response.status == 401) {
          localStorage.removeItem("access_token");
          checkStar(owner, repo);
        } else if (response.status == 404) {
          if (failCallback != null) {
            failCallback();
          } else {
            //替换 html body中 class为 content-wrapper 中的内容,适配vuepress
            replaceHtml(`
                                <div>
                                检测到您还未 Star 本项目，暂时无法访问本页面。<br/>
                              请先前往：<a target="_blank" href="https://gitee.com/${owner}/${repo}">https://gitee.com/${owner}/${repo}</a> 完成操作，再尝试刷新当前页面。
                                </div>
                                `);
          }
        }
      })
      .catch(error => console.error(error));
  }

  function checkAuthorize(owner, repo, file, failCallback) {
    let access_token = checkAccessToken();
    if (access_token == null) {
      return;
    }
    let user = getUserInfo();

    //浮层遮挡，提示授权检测中
    // 创建一个遮罩层元素
    const mask = document.createElement("div");
    mask.style.position = "fixed";
    mask.style.top = "0";
    mask.style.left = "0";
    mask.style.width = "100%";
    mask.style.height = "100%";
    mask.style.backgroundColor = "rgba(255, 255, 255, 0.8)"; // 不透明白色背景
    mask.style.backdropFilter = "blur(10px)"; // 添加玻璃效果
    mask.style.zIndex = "9999"; // 确保遮罩层在最上层

// 创建一个提示框元素
    const promptBox = document.createElement("div");
    promptBox.style.position = "fixed";
    promptBox.style.top = "50%";
    promptBox.style.left = "50%";
    promptBox.style.transform = "translate(-50%, -50%)";
    promptBox.style.padding = "20px";
    promptBox.style.backgroundColor = "#fff";
    promptBox.style.borderRadius = "5px";
    promptBox.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.3)";
    promptBox.style.zIndex = "10000"; // 确保提示框在遮罩层之上

    // 设置提示框内容
    promptBox.innerHTML = "<p>授权检测中，请稍候...</p>";
    // 将遮罩层和提示框添加到页面中
    document.body.appendChild(mask);
    document.body.appendChild(promptBox);

    fetch("https://gitee.com/api/v5/repos/" + owner + "/" + repo + "/contents/" + file + "?access_token=" + access_token, {
      method: "GET"
    })
      .then(response => {
        console.log("check result", response);
        if (response.status == 200) {
          //解析body
          response.json().then(function(data) {
            console.log("check result", data);
            //解析base64,
            let content = atob(data.content);
            //转成utf8
            content = decodeURIComponent(escape(content));

            console.log("check result", content);
            //解析json
            let json = JSON.parse(content);
            localStorage.setItem("userCount", Object.keys(json).length);
            let user = json[user?.login];
            //用户未授权
            if (!user) {
              if (failCallback != null) {
                failCallback("unauthorized");
              } else {
                replaceHtml(`<div>
                              未经授权暂时无法访问该页面。<br/>
                               </div>
                                `);
              }
              return;
            }

            //判断是否过期，expireTime为字符串，例如"2025-03-04"
            if (user?.expireTime && new Date(user.expireTime).getTime() < Date.now()) {
              if (failCallback != null) {
                failCallback("expired");
              } else {
                replaceHtml(`<div>
                              授权已过期。<br/>
                               </div>
                                `);
              }
              return;
            }

            console.log("check result", "ok");
            // 授权检测完成后，移除遮罩层和提示框
            document.body.removeChild(mask);
            document.body.removeChild(promptBox);

          });
        } else {
          console.log("check fail result", response);
          localStorage.removeItem("access_token");
          checkAuthorize(owner, repo, file);
        }
      })
      .catch(error => console.error(error));
  }

  function replaceHtml(html) {
    //替换 html body中 class为 content-wrapper 中的内容,适配vuepress
    d = document.querySelector(".content-wrapper");
    if (d == null) {
      //适配 astro
      d = document.querySelector(".main-pane");
    }
    if (d == null) {
      d = document.getElementsByTagName("body")[0];
    }
    d.innerHTML = html;
  }

  window.checkStar = checkStar;
  window.redirect = redirect;
  window.checkAuthorize = checkAuthorize;
}
