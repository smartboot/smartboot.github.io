//检查cookie star是否存在
if(typeof window !== 'undefined'){
    client_id="df82f8c4251350869fff94fb5395c580fc518956165ee82ada04308c6ff16c23";
    client_secret="a12f46c9eb633ad46b1f3bf845e2c6017705b62e16258f3ca05f51e4a03a9945";
    const gitee_redirect_uri = location.origin;

//提取 cookie中存储的 access_token
    console.log("cookie",document.cookie);
    access_token = document.cookie.split(';').find(row => row.trim().startsWith('access_token='))?.substring(14);
    console.log("access_token",access_token);

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
                        access_token = resp.access_token
                        document.cookie = "access_token=" + resp.access_token + "; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/";
                        window.location.href = state;
                    } else if ("invalid_grant_accessibility" == resp.error) {
                        window.location.href = 'https://gitee.com/oauth/authorize?client_id=' + client_id + '&redirect_uri=' + gitee_redirect_uri + '&response_type=code';
                    }
                })
                .catch(error => console.error(error));
        }
    }
    function checkStar(owner, repo) {
        if (access_token==null) {
            window.location.href = 'https://gitee.com/oauth/authorize?client_id=' + client_id + '&redirect_uri=' + gitee_redirect_uri + '&response_type=code&state=' + location.href;
            return
        }
        fetch("https://gitee.com/api/v5/user/starred/"+owner+"/"+repo+"?access_token="+access_token, {
            method: "GET"
        })
            .then(response => {
                console.log("check result",response);
                if(response.status==204){
                }else if(response.status==404){
                    //移除cookie
                    // alert("还未Star")
                    //替换 html body中 class为 content-wrapper 中的内容
                    d=document.querySelector(".content-wrapper")
                    if(d==null){
                        d=document.getElementsByTagName("body")[0]
                    }
                    d.innerHTML = `
                                检测到您还未 Star 本项目，暂时无法访问本页面。
                              请先前往：<a target="_blank" href="https://gitee.com/${owner}/${repo}">https://gitee.com/${owner}/${repo}</a> 完成操作
                                </div>
                                `
                }
            })
            .catch(error => console.error(error));
    }
}
