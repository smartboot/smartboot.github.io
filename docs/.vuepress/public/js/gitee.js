if (typeof window !== 'undefined') {
    client_id = "df82f8c4251350869fff94fb5395c580fc518956165ee82ada04308c6ff16c23";
    client_secret = "a12f46c9eb633ad46b1f3bf845e2c6017705b62e16258f3ca05f51e4a03a9945";
    const gitee_redirect_uri = location.origin;

    function redirect() {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        if (code != null) {
            fetch("https://gitee.com/oauth/token?grant_type=authorization_code&code=" + code + "&client_id=" + client_id + "&redirect_uri=" + gitee_redirect_uri + "&client_secret=" + client_secret, {
                method: "POST"
            })
                .then(response => response.text())
                .then(result => {
                    resp = JSON.parse(result)
                    console.log("result", resp);
                    if (resp.access_token != null) {
                        //获取用户信息
                        localStorage.removeItem('gitee_user');
                        const token = resp.access_token
                        fetch("https://gitee.com/api/v5/user?access_token=" + token, {
                            method: "GET"
                        }).then(response => response.text())
                            .then(result => {
                                resp = JSON.parse(result)
                                console.log("result", resp);
                                localStorage.setItem('access_token', token);
                                localStorage.setItem('gitee_user', result);
                                window.location.href = state + "?timestamp=" + Date.now();
                            })

                    } else if ("invalid_grant_accessibility" == resp.error) {
                        window.location.href = 'https://gitee.com/oauth/authorize?client_id=' + client_id + '&redirect_uri=' + gitee_redirect_uri + '&response_type=code';
                    }
                })
                .catch(error => console.error(error));
        }
    }

    function getUserInfo() {
        let access_token = checkAccessToken()
        if (access_token == null) {
            return
        }
        let user = localStorage.getItem('gitee_user')
        if (user != null) {
            return JSON.parse(user)
        }
    }

    function checkAccessToken() {
        let access_token = localStorage.getItem('access_token')
        console.log("access_token", access_token);
        if (access_token == null) {
            window.location.href = 'https://gitee.com/oauth/authorize?client_id=' + client_id + '&redirect_uri=' + gitee_redirect_uri + '&response_type=code&state=' + location.href;
            return null;
        } else {
            return access_token;
        }
    }

    function checkStar(owner, repo) {
        //文档首页不校验
        if (location.pathname === repo || location.pathname === repo + '/') {
            return;
        }
        let access_token = checkAccessToken()
        if (access_token == null) {
            return
        }
        fetch("https://gitee.com/api/v5/user/starred/" + owner + "/" + repo + "?access_token=" + access_token, {
            method: "GET"
        })
            .then(response => {
                console.log("check result", response);
                if (response.status == 204) {
                } else if (response.status == 401) {
                    localStorage.removeItem("access_token")
                    checkStar(owner, repo)
                } else if (response.status == 404) {
                    //替换 html body中 class为 content-wrapper 中的内容,适配vuepress
                    replaceHtml(`
                                <div>
                                检测到您还未 Star 本项目，暂时无法访问本页面。<br/>
                              请先前往：<a target="_blank" href="https://gitee.com/${owner}/${repo}">https://gitee.com/${owner}/${repo}</a> 完成操作，再尝试刷新当前页面。
                                </div>
                                `)
                }
            })
            .catch(error => console.error(error));
    }

    function checkAuthorize(owner, repo, file) {
        let access_token = checkAccessToken()
        if (access_token == null) {
            return
        }
        let user = getUserInfo()
        fetch("https://gitee.com/api/v5/repos/" + owner + "/" + repo + "/contents/" + file + "?access_token=" + access_token, {
            method: "GET"
        })
            .then(response => {
                console.log("check result", response);
                if (response.status == 200) {
                    //解析body
                    response.json().then(function (data) {
                        console.log("check result", data);
                        //解析base64,
                        let content = atob(data.content)
                        //转成utf8
                        content = decodeURIComponent(escape(content))

                        console.log("check result", content);
                        //解析json
                        let json = JSON.parse(content)
                        if (json[user?.login] != null) {
                            console.log("check result", "ok");
                        } else {
                            replaceHtml(`<div>
                              未经授权暂时无法访问该页面。<br/>
                               </div>
                                `)
                        }
                    });
                } else {
                    console.log("check fail result", response)
                    localStorage.removeItem("access_token")
                    checkAuthorize(owner, repo, file)
                }
            })
            .catch(error => console.error(error));
    }

    function replaceHtml(html) {
        //替换 html body中 class为 content-wrapper 中的内容,适配vuepress
        d = document.querySelector(".content-wrapper")
        if (d == null) {
            //适配 astro
            d = document.querySelector(".main-pane")
        }
        if (d == null) {
            d = document.getElementsByTagName("body")[0]
        }
        d.innerHTML = html
    }

    window.checkStar = checkStar;
    window.redirect = redirect;
    window.checkAuthorize = checkAuthorize;
}
