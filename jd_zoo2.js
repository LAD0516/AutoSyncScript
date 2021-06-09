/*
动物联萌 618活动
更新时间：2021-06-09 13:52
做任务，收金币
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
// quantumultx
[task_local]
#动物联萌
5 * * * * https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/scripts/jd/jd_zoo.js, tag=动物联萌, img-url=https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/image/jd.png, enabled=true
// Loon
[Script]
cron "5 * * * *" script-path=https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/scripts/jd/jd_zoo.js,tag=动物联萌
// Surge
动物联萌 = type=cron,cronexp=5 * * * *,wake-system=1,timeout=500,script-path=https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/scripts/jd/jd_zoo.js
*/
const $ = new Env('动物联萌');
//Node.js用户请在jdCookie.js处填写京东ck;
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '',secretp = '',shareCodeList = [],showCode = true;
let doPkSkill = true;  //自动放技能，不需要的改为false
const JD_API_HOST = `https://api.m.jd.com/client.action?functionId=`;
!(async () => {
  await requireConfig()
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', {"open-url": "https://bean.m.jd.com/"});
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    cookie = cookiesArr[i];
    if (cookie) {
      if (i) console.log(`\n***************开始京东账号${i + 1}***************`)
      initial();
      await  QueryJDUserInfo();
      if (!merge.enabled)  //cookie不可用
      {
        $.setdata('', `CookieJD${i ? i + 1 : "" }`);//cookie失效，故清空cookie。
        $.msg($.name, `【提示】京东账号${i ? i + 1 : "" } cookie已过期！请先获取cookie\n直接使用NobyDa的京东签到获取`, 'https://bean.m.jd.com/', {"open-url": "https://bean.m.jd.com/"});
        continue;
      }
      console.log('\n\n京东账号：'+merge.nickname + ' 任务开始')
      await zoo_sign()
      await zoo_pk_getHomeData();
      await zoo_getHomeData();
      if (merge.black) continue;
      //await qryCompositeMaterials()
      await msgShow();
      //break;
    }
  }
})()
  .catch((e) => $.logErr(e))
  .finally(() => $.done())

//获取昵称（直接用，勿删）
function QueryJDUserInfo(timeout = 0) {
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
        headers : {
          'Referer' : `https://wqs.jd.com/my/iserinfo.html`,
          'Cookie' : cookie
        }
      }
      $.get(url, (err, resp, data) => {
        try {
          data = JSON.parse(data);
          if (data.retcode === 13) {
            merge.enabled = false
            return
          }
          merge.nickname = data.base.nickname;
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

//查询任务 "appSign":"2","channel":1,
function zoo_getTaskDetail(shopSign = "",appSign = "",timeout = 0){
  return new Promise((resolve) => {
    setTimeout( ()=>{
      appSign = appSign&&'"appSign":"2","channel":1,'
      let url = {
        url : `${JD_API_HOST}zoo_getTaskDetail`,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : `functionId=zoo_getTaskDetail&body={${appSign}"shopSign":"${shopSign}"}&client=wh5&clientVersion=1.0.0`
      }
      //if (shopSign) {
      //  console.log(shopSign)
      //  url.url = url.url.replace('zoo_getTaskDetail','zoo_shopLotteryInfo')
      //  url.body = url.body.replace('zoo_getTaskDetail','zoo_shopLotteryInfo')
      //}
      $.post(url, async (err, resp, data) => {
        try {
          //console.log('zoo_getTaskDetail:' + data)
          data = JSON.parse(data);
          if (shopSign === "") {
            shopSign = '""'
            if (appSign === "" && typeof data.data.result.inviteId !== "undefined") console.log(`您的个人助力码：${data.data.result.inviteId}`)
          }
          if (!data.data.result) return
          for (let i = 0;i < data.data.result.taskVos.length;i ++) {
            //if (merge.black)  return ;
            console.log( "\n" + data.data.result.taskVos[i].taskType + '-' + data.data.result.taskVos[i].taskName + (appSign&&"（小程序）") + '-'  +  (data.data.result.taskVos[i].status === 1 ? `已完成${data.data.result.taskVos[i].times}-未完成${data.data.result.taskVos[i].maxTimes}` : "全部已完成")  )
            if ([1,2,3,5,7,9,26].includes(data.data.result.taskVos[i].taskType) && data.data.result.taskVos[i].status === 1 ) {
              let list = data.data.result.taskVos[i].productInfoVos||data.data.result.taskVos[i].brandMemberVos||data.data.result.taskVos[i].followShopVo||data.data.result.taskVos[i].shoppingActivityVos||data.data.result.taskVos[i].browseShopVo
              //console.log(list)
              //if (data.data.result.taskVos[i].taskType === 9) continue
              for (let k = data.data.result.taskVos[i].times; k < data.data.result.taskVos[i].maxTimes; k++) {
                for (let j in list) {
                  if (list[j].status === 1) {
                    //let taskBody = `functionId=zoo_collectScore&body={"taskId":"${data.data.result.taskVos[i].taskId}","actionType":1,"taskToken":"${list[j].taskToken}","ss":"{\\"extraData\\":{\\"log\\":\\"${sign}\\",\\"sceneid\\":\\"DR216hPageh5\\"},\\"secretp\\":\\"${secretp}\\",\\"random\\":\\"${rnd}\\"}"}&client=wh5&clientVersion=1.0.0`
                    let taskBody = `functionId=zoo_collectScore&body=${JSON.stringify({"taskId": data.data.result.taskVos[i].taskId,"actionType":1,"taskToken" : list[j].taskToken,"ss" : getBody()})}&client=wh5&clientVersion=1.0.0`
                    console.log("\n"+(list[j].title||list[j].shopName||list[j].skuName))
                    await zoo_collectScore(taskBody,2000)
                    //}
                    list[j].status = 2;
                    break;
                  } else {
                    continue;
                  }
                }
              }
            }

            if ([12,13].includes(data.data.result.taskVos[i].taskType) && data.data.result.taskVos[i].status === 1) {
              //let  taskBody = `functionId=zoo_collectScore&body={"taskId":${data.data.result.taskVos[i].taskId},"itemId":"1","ss":"{\\"extraData\\":{},\\"businessData\\":{},\\"secretp\\":\\"${secretp}\\"}","shopSign":${shopSign}}&client=wh5&clientVersion=1.0.0`
              for (let k = data.data.result.taskVos[i].times; k < data.data.result.taskVos[i].maxTimes; k++) {
                //let taskBody = `functionId=zoo_collectScore&body={"taskId":${data.data.result.taskVos[i].taskId},"itemId":"1","ss":"{\\"extraData\\":{\\"is_trust\\":true,\\"sign\\":\\"${sign}\\",\\"time\\":${time},\\"encrypt\\":\\"3\\",\\"nonstr\\":\\"${nonstr}\\",\\"jj\\":\\"\\",\\"token\\":\\"d89985df35e6a2227fd2e85fe78116d2\\",\\"cf_v\\":\\"1.0.1\\",\\"client_version\\":\\"2.1.3\\",\\"sceneid\\":\\"QD216hPageh5\\"},\\"businessData\\":{\\"taskId\\":\\"${data.data.result.taskVos[i].taskId}\\",\\"rnd\\":\\"${rnd}\\",\\"inviteId\\":\\"-1\\",\\"stealId\\":\\"-1\\"},\\"secretp\\":\\"${secretp}\\"}","actionType":"1","shopSign":${shopSign}}&client=wh5&clientVersion=1.0.0`
                //let taskBody = `functionId=zoo_collectScore&body={"taskId":${data.data.result.taskVos[i].taskId},"taskToken" : "${list[j].taskToken}","ss":"{\\"extraData\\":{\\"is_trust\\":true,\\"sign\\":\\"${sign}\\",\\"fpb\\":\\"\\",\\"time\\":${time},\\"encrypt\\":\\"3\\",\\"nonstr\\":\\"${nonstr}\\",\\"jj\\":\\"\\",\\"token\\":\\"d89985df35e6a2227fd2e85fe78116d2\\",\\"cf_v\\":\\"1.0.2\\",\\"client_version\\":\\"2.2.1\\",\\"buttonid\\":\\"jmdd-react-smash_62\\",\\"sceneid\\":\\"QD216hPageh5\\"},\\"secretp\\":\\"${secretp}\\",\\"random\\":\\"${rnd}\\"}","itemId":"1","actionType":1,"shopSign":${shopSign}}&client=wh5&clientVersion=1.0.0`
                let taskBody = `functionId=zoo_collectScore&body=${JSON.stringify({"taskId": data.data.result.taskVos[i].taskId,"taskToken" : list[j].taskToken,"ss" : getBody()})}&client=wh5&clientVersion=1.0.0`
                if (merge.black)  return ;
                  //if (typeof data.data.result.taskVos[i].simpleRecordInfoVo !== "undefined"){
                  //  taskBody = encodeURIComponent(`{"dataSource":"newshortAward","method":"getTaskAward","reqParams":"{\\"taskToken\\":\\"${data.data.result.taskVos[i].simpleRecordInfoVo.taskToken}\\"}","sdkVersion":"1.0.0","clientLanguage":"zh"}`)
                  //  await qryViewkitCallbackResult(taskBody,1000)
                  //} else {
                await zoo_collectScore(taskBody,1000)
                  //}
                }
            }

            if ([2].includes(data.data.result.taskVos[i].taskType) && data.data.result.taskVos[i].status === 1 && !data.data.result.taskVos[i].taskName.includes("逛逛")) {
              for (let k = data.data.result.taskVos[i].times; k < data.data.result.taskVos[i].maxTimes; k++) {
                await zoo_getFeedDetail(data.data.result.taskVos[i].taskId)
              }
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

//获取我的城市
function zoo_myMap(timeout = 0){
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_myMap`,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : `functionId=zoo_myMap&body={"ss":"{\\"extraData\\":{},\\"businessData\\":{},\\"secretp\\":\\"${secretp}\\"}"}&client=wh5&clientVersion=1.0.0`
      }
      $.post(url, async (err, resp, data) => {
        try {
          console.log('zoo_myMap:' + data)
          data = JSON.parse(data);
          for (let i in data.data.result.shopList) {
            // (data.data.result.shopList[i].status === 1) {
              //console.log(data.data.result.shopList[i])
            console.log('\n开始小镇任务：'+ data.data.result.shopList[i].name)// + '-' + data.data.result.shopList[i].shopId
            await zoo_getTaskDetail(data.data.result.shopList[i].shopId)
            //}
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}
//发技能
function zoo_pk_doPkSkill(skillType, timeout = 0){
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_pk_doPkSkill`,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : `functionId=zoo_pk_doPkSkill&body={"skillType" : "${skillType}"}&client=wh5&clientVersion=1.0.0`
      }
      $.post(url, async (err, resp, data) => {
        try {
          //console.log('zoo_pk_doPkSkill:' + data)
          data = JSON.parse(data);
          if (data.data.bizCode === 0) {
            console.log('技能获得：' + data.data.result.skillValue);
          } else {
            console.log('技能释放失败：' + data.data.bizMsg);
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}
//签到
function zoo_sign(timeout = 0){
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_sign`,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : `functionId=zoo_sign&body={}&client=wh5&clientVersion=1.0.0`
      }
      $.post(url, async (err, resp, data) => {
        try {
          //console.log(data)
          data = JSON.parse(data);
          console.log('签到结果：' + data.data.bizMsg);
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

//逛商城
function zoo_shopSignInWrite(shopSign,timeout = 0){
  return new Promise((resolve) => {

    let rnd = Math.round(Math.random()*1e6)
    let nonstr = randomWord(false,10)
    let time = Date.now()
    let key = minusByByte(nonstr.slice(0,5),String(time).slice(-5))
    let msg = `inviteId=-1&rnd=${rnd}&stealId=-1&taskId=${shopSign}&token=d89985df35e6a2227fd2e85fe78116d2&time=${time}&nonce_str=${nonstr}&key=${key}&is_trust=1`
    let sign = bytesToHex(wordsToBytes(getSign(msg))).toUpperCase()

    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_shopSignInWrite`,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : `functionId=zoo_shopSignInWrite&body={"shopSign":"${shopSign}","ss":"{\\"extraData\\":{\\"is_trust\\":true,\\"sign\\":\\"${sign}\\",\\"time\\":${time},\\"encrypt\\":\\"3\\",\\"nonstr\\":\\"${nonstr}\\",\\"jj\\":\\"\\",\\"token\\":\\"d89985df35e6a2227fd2e85fe78116d2\\",\\"cf_v\\":\\"1.0.1\\",\\"client_version\\":\\"2.1.3\\",\\"sceneid\\":\\"QD216hPageh5\\"},\\"businessData\\":{\\"taskId\\":\\"${shopSign}\\",\\"rnd\\":\\"${rnd}\\",\\"inviteId\\":\\"-1\\",\\"stealId\\":\\"-1\\"},\\"secretp\\":\\"${secretp}\\"}"}&client=wh5&clientVersion=1.0.0`
      }
      $.post(url, async (err, resp, data) => {
        try {
          //console.log(data)
          data = JSON.parse(data);
          if (data.data.bizCode !== 0) {
            console.log(data.data.bizMsg)
            merge.end = true
          } else {
            console.log('获得金币' + data.data.result.score)
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

//逛商城
function zoo_shopSignInRead(shopSign,timeout = 0){
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_shopSignInRead`,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : `functionId=zoo_shopSignInRead&client=wh5&clientVersion=1.0.0&body={"shopSign":"${shopSign}"}`
      }
      $.post(url, async (err, resp, data) => {
        try {
          console.log(data)
          data = JSON.parse(data);
          if (data.data.result.signInTag === 0) {
             secretp = secretp||data.data.result.secretp
             await zoo_shopSignInWrite(shopSign)
          } else {
            console.log('已逛过')
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

//收金币
function zoo_collectProduceScore(timeout = 0){
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_collectProduceScore`,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`,
          'Content-Type' : `application/x-www-form-urlencoded`
        },
        body : `functionId=zoo_collectProduceScore&body=${JSON.stringify({"ss" : getBody()})}&client=wh5&clientVersion=1.0.0`
      }
      //console.log(url.body)
      $.post(url, async (err, resp, data) => {
        try {
          //console.log(data)
          data = JSON.parse(data);
          if (data.data.bizCode === -1002) {
            console.log('此账号暂不可使用脚本，脚本终止！')
            merge.black = true;
            return ;
          }
          if (data.data.result) console.log(`\n收取金币：${data.data.result.produceScore}`)
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

//做任务
function zoo_collectScore(taskBody,timeout = 0){
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_collectScore`,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : taskBody
        }
      //console.log(url.body)
      $.post(url, async (err, resp, data) => {
        try {
          //console.log(data)
          data = JSON.parse(data);
          console.log('任务执行结果：' + data.data.bizMsg)
          if (data.data.bizCode === -1002) {
            //console.log(url.body)
            //console.log('\n提示火爆，休息5秒')
            //await $.wait(5000)
            //await zoo_collectScore(taskBody)
            console.log('此账号暂不可使用脚本，脚本终止！')
            merge.black = true;
            return ;
          }
          if (data.data.bizCode === 0 && typeof data.data.result.taskToken !== "undefined") {
            //console.log('需要再次执行,如提示活动异常请多次重试，个别任务多次执行也不行就去APP做吧！')
            let taskBody = encodeURIComponent(`{"dataSource":"newshortAward","method":"getTaskAward","reqParams":"{\\"taskToken\\":\\"${data.data.result.taskToken}\\"}","sdkVersion":"1.0.0","clientLanguage":"zh"}`)
            //console.log(taskBody)
            await qryViewkitCallbackResult(taskBody,7000)
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

//做任务
function zoo_doAdditionalTask(taskBody,timeout = 0){
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_doAdditionalTask`,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : taskBody
      }
      //console.log(url.body)
      $.post(url, async (err, resp, data) => {
        try {
          console.log(data)
          data = JSON.parse(data);
          console.log('任务执行结果：' + data.data.bizMsg)
          if (data.data.bizCode === -1002) {
            console.log('\n提示火爆，休息5秒')
            await $.wait(5000)
            return ;
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

//查询甄选任务
function zoo_getFeedDetail(taskId,timeout = 0){
  return new Promise((resolve) => {

    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_getFeedDetail`,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : `functionId=zoo_getFeedDetail&body={"taskId":"${taskId}"}&client=wh5&clientVersion=1.0.0`
      }
      //console.log(url)
      $.post(url, async (err, resp, data) => {
        try {
          //console.log(data)
          data = JSON.parse(data);
          let list =  data.data.result.viewProductVos||data.data.result.addProductVos
          for (let i in list) {
            if (list[i].status === 1) {
              for (let j in list[i].productInfoVos) {
                if (j >= 5)  break;
                //${JSON.stringify({"ss" : getBody()})}
                //let taskBody = `functionId=zoo_collectScore&body={"taskId":${list[i].taskId},"taskToken" : "${list[i].productInfoVos[j].taskToken}","ss":"{\\"extraData\\":{\\"log\\":\\"${sign}\\",\\"sceneid\\":\\"QD216hPageh5\\"},\\"secretp\\":\\"${secretp}\\",\\"random\\":\\"${rnd}\\"}","actionType":1}&client=wh5&clientVersion=1.0.0`
                let taskBody = `functionId=zoo_collectScore&body=${JSON.stringify({"taskId": list[i].taskId,"actionType":1,"taskToken" : list[i].productInfoVos[j].taskToken,"ss" : getBody()})}&client=wh5&clientVersion=1.0.0`
                //console.log(taskBody)
                console.log(list[i].productInfoVos[j].skuName)
                await zoo_collectScore(taskBody,1000)
              }
              list[i].status = 2
            }
          }

        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

//做任务2
function qryViewkitCallbackResult(taskBody,timeout = 0) {
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `https://api.m.jd.com/?functionId=qryViewkitCallbackResult&client=wh5&clientVersion=1.0.0&body=${taskBody}&_timestamp=`+Date.now(),
        headers : {
          'Origin' : `https://bunearth.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `*/*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`,
          'Content-Type' : 'application/x-www-form-urlencoded',
          'Referer' : 'https://bunearth.m.jd.com/babelDiy/Zeus/4SJUHwGdUQYgg94PFzjZZbGZRjDd/index.html?jmddToSmartEntry=login'
        }
       }

      $.get(url, async (err, resp, data) => {
        try {
          //console.log(url.url)
          //console.log(data)
          data = JSON.parse(data);
          console.log(data.toast.subTitle)
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

//群组助力
function zoo_pk_assistGroup(inviteId = "",timeout = 0) {
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_pk_assistGroup`  ,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.6;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`,
          'Refer' : `https://bunearth.m.jd.com/babelDiy/Zeus/4SJUHwGdUQYgg94PFzjZZbGZRjDd/index.html?jmddToSmartEntry=login`
        },
        body : `functionId=zoo_pk_assistGroup&body=${JSON.stringify({"confirmFlag": 1,"inviteId" : inviteId,"ss" : getBody()})}&client=wh5&clientVersion=1.0.0`
      }
      //console.log(url.body)
      $.post(url, async (err, resp, data) => {
        try {
          //console.log('商圈助力：' + data)
          data = JSON.parse(data);
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

//获取首页信息
function zoo_getHomeData(inviteId= "",timeout = 0) {
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_getHomeData`  ,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : `functionId=zoo_getHomeData&body={${inviteId ? "\"inviteId\":\"" + inviteId +'\"': ""}}&client=wh5&clientVersion=1.0.0`
      }
      $.post(url, async (err, resp, data) => {
        try {
          //console.log(data)
          //if (merge.black)  return ;
          data = JSON.parse(data);
          if (data.code === 0) {
            if (inviteId !== "") {
              let taskBody = `functionId=zoo_collectScore&body=${JSON.stringify({"taskId": 2,"inviteId":inviteId,"actionType":1,"ss" : getBody()})}&client=wh5&clientVersion=1.0.0`
              await zoo_collectScore(taskBody, 1000)
              return
            }
            //console.log('zoo_getHomeData:' + JSON.stringify(data))
            secretp = data.data.result.homeMainInfo.secretp
            await zoo_collectProduceScore();
            if (merge.black) return;
            await zoo_pk_getHomeData('sSKNX-MpqKOJsNu_mZneBluwe_DRzs1f90l6Q_p8OVxtoB-JJEErrVU4eHW7e2I')
            //await zoo_pk_assistGroup()
            //if (data.data.result.homeMainInfo.raiseInfo.buttonStatus === 1 )
            if (parseInt(data.data.result.homeMainInfo.raiseInfo.totalScore) >= parseInt(data.data.result.homeMainInfo.raiseInfo.nextLevelScore) ) await zoo_raise(1000)
            await zoo_getHomeData('ZXTKT0225KkcRx4b8lbWJU72wvZZcwFjRWn6-7zx55awQ');//ZXTKT0225KkcRBka_FPTJBjzkv9YfAFjRWn6-7zx55awQ
            await zoo_getTaskDetail()
            await zoo_getTaskDetail("","app")
          } else {
            return
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

function zoo_raise(timeout = 0) {
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_raise`  ,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : `functionId=zoo_raise&body={}&client=wh5&clientVersion=1.0.0`
      }
      $.post(url, async (err, resp, data) => {
        try {
          //console.log(data)
          data = JSON.parse(data);
          console.log('解锁结果：'+ (data.data.bizCode||'成功'))
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

function qryCompositeMaterials(timeout = 0) {
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}qryCompositeMaterials`  ,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : `functionId=qryCompositeMaterials&body={"qryParam":"[{\\"type\\":\\"advertGroup\\",\\"mapTo\\":\\"viewLogo\\",\\"id\\":\\"05149412\\"},{\\"type\\":\\"advertGroup\\",\\"mapTo\\":\\"bottomLogo\\",\\"id\\":\\"05149413\\"}]","activityId":"2cKMj86srRdhgWcKonfExzK4ZMBy","pageId":"","reqSrc":"","applyKey":"21beast"}&client=wh5&clientVersion=1.0.0`
      }
      $.post(url, async (err, resp, data) => {
        try {
          //console.log(data)
          data = JSON.parse(data);
          for (let i in data.data.viewLogo.list) {
            await zoo_getTaskDetail(data.data.viewLogo.list[i].desc)
          }
          for (let i in data.data.bottomLogo.list) {
            await zoo_getTaskDetail(data.data.bottomLogo.list[i].desc)
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

function zoo_pk_getHomeData(inviteId = "",timeout = 0) {
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_pk_getHomeData`  ,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : `functionId=zoo_pk_getHomeData&body={}&client=wh5&clientVersion=1.0.0`
      }
      $.post(url, async (err, resp, data) => {
        try {
          if (inviteId !== "") {
            shareCodeList = [
              'sSKNX-MpqKOSoe_kxcaPW1nBlw_ySBW6IqczfUWPMRbjC39I0gLEtOMy',
              'sSKNX-MpqKOJsNu8y8_ZUOBmjH5K8SurxYngZ6dVhlv-JcuXRUrO9WMfLvwtQo3a'
            ]
            for (let i in shareCodeList) {
              if (shareCodeList[i]) await zoo_pk_assistGroup(shareCodeList[i]);
            }
            //await zoo_pk_assistGroup(inviteId);
          } else {
            //console.log(data);
            data = JSON.parse(data);
            if (showCode) {
              console.log('您的队伍助力码：' + data.data.result.groupInfo.groupAssistInviteId);
              showCode = false;
            }
            if (!doPkSkill) return ;
            if (typeof data.data.result.groupPkInfo.dayTotalValue !== "undefined") {
              if (parseInt(data.data.result.groupPkInfo.dayTotalValue) >= parseInt(data.data.result.groupPkInfo.dayTargetSell)) return;
            }
            else
            if (typeof data.data.result.groupPkInfo.nightTotalValue !== "undefined") {
              if (parseInt(data.data.result.groupPkInfo.nightTotalValue) >= parseInt(data.data.result.groupPkInfo.nightTargetSell)) return;
            }
            else
              return;
            let list = data.data.result.groupInfo.skillList;
            for (let i = list.length -1; i>=0; i--) {
              if (parseInt(list[i].num) > 0) {
                await zoo_pk_doPkSkill(list[i].code,800);
                await zoo_pk_getHomeData();
                break;
              }
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

function requireConfig() {
  return new Promise(resolve => {
    //Node.js用户请在jdCookie.js处填写京东ck;
    const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
    //IOS等用户直接用NobyDa的jd cookie
    if ($.isNode()) {
      Object.keys(jdCookieNode).forEach((item) => {
        if (jdCookieNode[item]) {
          cookiesArr.push(jdCookieNode[item])
        }
      })
    } else {
      let cookiesData = $.getdata('CookiesJD') || "[]";
      cookiesData = jsonParse(cookiesData);
      cookiesArr = cookiesData.map(item => item.cookie);
      cookiesArr.reverse();
      cookiesArr.push(...[$.getdata('CookieJD2'), $.getdata('CookieJD')]);
      cookiesArr.reverse();
      cookiesArr = cookiesArr.filter(item => item !== "" && item !== null && item !== undefined);
    }
    console.log(`共${cookiesArr.length}个京东账号\n`);
    resolve()
  })
}

function jsonParse(str) {
  if (typeof str == "string") {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.log(e);
      $.msg($.name, '', '请勿随意在BoxJs输入框修改内容\n建议通过脚本去获取cookie')
      return [];
    }
  }
}
//初始化
function initial() {
  merge = {
    nickname: "",
    enabled: true,
    end: false,
    black: false
  }
  for (let i in merge) {
    merge[i].success = 0;
    merge[i].fail = 0;
    merge[i].prizeCount = 0;
    merge[i].notify = "";
    merge[i].show = true;
  }
  showCode = true;
}
//通知
function msgShow() {
  console.log("\n\n京东账号："+merge.nickname + ' 任务已做完！\n如有未完成的任务，请多执行几次')
 //$.msg($.Name,"","京东账号："+merge.nickname + ' 任务已做完！\n如有未完成的任务，请多执行几次')
}
var _0xodZ='jsjiami.com.v6',_0x10d2=[_0xodZ,'w5nCgMKqwoIdGUrDjGYKw7IQ','flvDj8KEw64bfXFyIsKOcQ==','wpx3fwlO','w6rCg8OrW00=','wqzDtybCl8ON','wp8bw4XDjsOe','WngiwrU6','w5MOwprDtMK3Y8KxNVhewo3Dl1sa','bG1KwpvDgA==','SRLDuEjDscOhY8KywqfDnQzDqQ==','w63Ds8K8wpMe','w4V9w493w55hNXhXGsOlRw==','TmvChB8C','VsO5SVJ5KkjCvsOkwoTCqsOW','w5fCr8K8MQo=','wrpcHMO3JA==','wpdCwozDkMKR','YVACwqce','wrPCv8KZGSE=','wr4Rw7vDrMON','wpPCkhTCrkbCol7CqWRn','wpVqcQck','TsOmTTV+','asKPw5/Cmgw=','ZMK+RcKjGA==','b2hLwqvDnQ==','w5XDu8KuwrsD','UcOJWyFJ','wqXCucOjwqXDow==','w7fCkcKmwrkY','wonDk8O7wq16','wpPCu8OlwoTDmw==','w48EVMKAw6s=','BW3CmywK','w67CocKOwqUZ','ZcKRScKUCQ==','Ql7DicK4w4Y=','wqJFAMOFwrk=','wr7DocOpwqVI','w5LDtCLDhMKU','wrQDw5bDgMOq','wq3DvCrCqsOx','wpvCscK9BjI=','wqJTdy0L','wrzCqC3Dgko=','w6x/w5B7bhLDscKYYMK9BsOSfS4bw74ZI09EwqU8w6AQLHLDpsKkwpt6eCEZVTFmwrczw4ETw6oJTAEIw5vCsXDCjyhYXivDrQ7DgRJPIcK0w7VmT8ODw6TCgUo7ITAaDsO6IiPDpcKObcK3UMOVwq4Vwp1vw6suwrRDwrISw78DwqTDtMKMwrHDtsObSMK6KcKaTsOkw4zDgcKwDcKB','w5vDusK7w5TDn8K1acKPdTLCv2o=','w6g/esK+w5I=','P8KdW0py','w67CnsOeXFc=','w7vDu8KMwoImw5EDwqc=','wqwlw7/DrMOt','w5UAwp4=','TMK9Z1dZdw==','CmLCkSlo','woVmw5NFw6l7IXlgSMKw','w6MGwqbCm2dbblXClydZ','w4bDisOlwonCmg==','wpzCs8Oqwr7Dnw==','O1PDncKiUQ==','wr7Cq8OywqbDtw==','bsObdjxT','wo49w6fDtMOF','LcK/RnNY','woZ5bC9S','wpvDncOMwrhOw6PDmws=','w4tLSsKgFw==','w53CuH/DnsO2','wq7ChsONwr7DsA==','w5kfwr7DmMK0','w5bDnQHDisKm','wplcPcO8wo0=','w4zChsKowq0d','wptcwqrDt8K9','w40ke8Kyw4c=','w5ZPw4RleA==','wpfCjsK7PD4=','w5fDjFvDlcKM','w5hCVcKqAg==','wqfDoDLCkcOi','wrLDpy7CtMOU','QGzCmjchw4Q=','QMO+VVc=','wqLCs8OlwozDgA==','w7rDi8O6wo0=','w77DgsKOwoMD','YwY7woA=','KFLChSoc','YcKORsKhDQ==','w4cfV8KLw5k=','XcO8Uito','w5jCqcKZNA8=','SnrChTcg','VsOiJ24w','VMOgP18F','wqJIO8OZwqs=','VMK2w4XClig=','w6wjQsKyw5Q=','w4Ivwqhqaw==','w70neMKTw6M=','wopTH8OLwqY=','wowrw5jDrsO7','CcKmXXxu','w6/DgjrDisKUPA==','w73CosOXX8OkdA==','w7d0w7dTTw==','XBJgwpXCl8Kaw4cn','w7LCr8OYSsOTc29Jwrot','wojCl8OGwqTDujDDmcKRFsK3','CHzCqgIj','wop6XDJrw6wpwrk=','wp3Dl8OvwqBdw6nDkA==','wqJeBMORwos=','WMKXdMK+Jg==','w4JrY8KuJg==','w7TCuk/DvcOa','w5fCtcOzVU0I','w5ZXbMKuAjU=','Xholwr/CvA==','wo3Dmh7CkMOQ','w6thw7gJw6I=','AMKiQWlQ','w49qw459w6lh','YA8Vw5PDvQ==','wpNtZTFa','w50kwohOXQ==','wodqBMO5JMO3','wpzCnxvCu3HCpQ==','w6I2e8K2w5QT','DW/DqcKgXMKmwqw1E20=','VcODHUI=','wpnCjxrDu0A=','wohlZS8kw5bCrg==','Ck/DocKBWA==','woHDosO+wpp0','w7A2wovDusKk','w4dCw5Ym','w63CpVPDnMO0','USA8wrzCsBobasOHCA==','XxsHw4DDuA==','B0DChS4Pw7M=','YRPDoVTDpw==','w5cKwofDnMK0ZQ==','a2XCgB86','w5DDghPDmcKF','bRZ1woXCgw==','eRwhwoY=','w7o8RsKlw5ISwpLDgg==','wp5fwozDlcKq','w6PDscKxwpEgw5A=','csOnOW8j','wrfDvD7CocOiLEvCjAFQ','woPDl8OxwqtIw6I=','w6bCpcO+b8OT','wqXCvBTCo1w=','VQ81FjDCrcOg','S0rCtwAR','w5LDv0/DpsK8','ECjwlHTsjiLaXmi.ATzVqqcom.Gv6=='];(function(_0x3af7b2,_0xef381f,_0x5991ff){var _0x23152b=function(_0x3edb8e,_0x5bf10d,_0x4806de,_0x2ad583,_0x2541f8){_0x5bf10d=_0x5bf10d>>0x8,_0x2541f8='po';var _0x271348='shift',_0x1e1d6a='push';if(_0x5bf10d<_0x3edb8e){while(--_0x3edb8e){_0x2ad583=_0x3af7b2[_0x271348]();if(_0x5bf10d===_0x3edb8e){_0x5bf10d=_0x2ad583;_0x4806de=_0x3af7b2[_0x2541f8+'p']();}else if(_0x5bf10d&&_0x4806de['replace'](/[ECwlHTLXATzVqqG=]/g,'')===_0x5bf10d){_0x3af7b2[_0x1e1d6a](_0x2ad583);}}_0x3af7b2[_0x1e1d6a](_0x3af7b2[_0x271348]());}return 0x8dc47;};return _0x23152b(++_0xef381f,_0x5991ff)>>_0xef381f^_0x5991ff;}(_0x10d2,0x64,0x6400));var _0x5d0f=function(_0x27842b,_0xf82ddd){_0x27842b=~~'0x'['concat'](_0x27842b);var _0x3feb27=_0x10d2[_0x27842b];if(_0x5d0f['JzCYFE']===undefined){(function(){var _0x5a67c0=function(){var _0xbaf440;try{_0xbaf440=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');')();}catch(_0x3cf27a){_0xbaf440=window;}return _0xbaf440;};var _0x544084=_0x5a67c0();var _0xe48a6c='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x544084['atob']||(_0x544084['atob']=function(_0x1f5173){var _0x41e4dc=String(_0x1f5173)['replace'](/=+$/,'');for(var _0x3148f4=0x0,_0x502018,_0x12e8c9,_0x2a589c=0x0,_0x3a9d1a='';_0x12e8c9=_0x41e4dc['charAt'](_0x2a589c++);~_0x12e8c9&&(_0x502018=_0x3148f4%0x4?_0x502018*0x40+_0x12e8c9:_0x12e8c9,_0x3148f4++%0x4)?_0x3a9d1a+=String['fromCharCode'](0xff&_0x502018>>(-0x2*_0x3148f4&0x6)):0x0){_0x12e8c9=_0xe48a6c['indexOf'](_0x12e8c9);}return _0x3a9d1a;});}());var _0x2f0f2e=function(_0x3cd7b7,_0xf82ddd){var _0x4420fb=[],_0x239f09=0x0,_0x238c64,_0x46a902='',_0x2c41c0='';_0x3cd7b7=atob(_0x3cd7b7);for(var _0xfddccd=0x0,_0x8808ca=_0x3cd7b7['length'];_0xfddccd<_0x8808ca;_0xfddccd++){_0x2c41c0+='%'+('00'+_0x3cd7b7['charCodeAt'](_0xfddccd)['toString'](0x10))['slice'](-0x2);}_0x3cd7b7=decodeURIComponent(_0x2c41c0);for(var _0x335a92=0x0;_0x335a92<0x100;_0x335a92++){_0x4420fb[_0x335a92]=_0x335a92;}for(_0x335a92=0x0;_0x335a92<0x100;_0x335a92++){_0x239f09=(_0x239f09+_0x4420fb[_0x335a92]+_0xf82ddd['charCodeAt'](_0x335a92%_0xf82ddd['length']))%0x100;_0x238c64=_0x4420fb[_0x335a92];_0x4420fb[_0x335a92]=_0x4420fb[_0x239f09];_0x4420fb[_0x239f09]=_0x238c64;}_0x335a92=0x0;_0x239f09=0x0;for(var _0x236fba=0x0;_0x236fba<_0x3cd7b7['length'];_0x236fba++){_0x335a92=(_0x335a92+0x1)%0x100;_0x239f09=(_0x239f09+_0x4420fb[_0x335a92])%0x100;_0x238c64=_0x4420fb[_0x335a92];_0x4420fb[_0x335a92]=_0x4420fb[_0x239f09];_0x4420fb[_0x239f09]=_0x238c64;_0x46a902+=String['fromCharCode'](_0x3cd7b7['charCodeAt'](_0x236fba)^_0x4420fb[(_0x4420fb[_0x335a92]+_0x4420fb[_0x239f09])%0x100]);}return _0x46a902;};_0x5d0f['EvfSsd']=_0x2f0f2e;_0x5d0f['kZTgYH']={};_0x5d0f['JzCYFE']=!![];}var _0x1e162e=_0x5d0f['kZTgYH'][_0x27842b];if(_0x1e162e===undefined){if(_0x5d0f['ttjIbk']===undefined){_0x5d0f['ttjIbk']=!![];}_0x3feb27=_0x5d0f['EvfSsd'](_0x3feb27,_0xf82ddd);_0x5d0f['kZTgYH'][_0x27842b]=_0x3feb27;}else{_0x3feb27=_0x1e162e;}return _0x3feb27;};function randomWord(_0x3cbcd9,_0x208412,_0x2a37b4){var _0x360b19={'coSFR':function(_0x4dfa7b,_0x483edf){return _0x4dfa7b<_0x483edf;},'VOacp':function(_0x29f85b,_0x471a22){return _0x29f85b^_0x471a22;},'cYAKX':function(_0x4607f5,_0x1fe932){return _0x4607f5%_0x1fe932;},'TKRPe':function(_0x5e2494,_0x219d87){return _0x5e2494!==_0x219d87;},'WBjjp':_0x5d0f('0','uKab'),'xuWNa':function(_0x4bde36,_0x4c9b16){return _0x4bde36+_0x4c9b16;},'xYagP':function(_0x41ca2a,_0x9bc70a){return _0x41ca2a-_0x9bc70a;},'jsuBK':function(_0x339931,_0x5667a7){return _0x339931<_0x5667a7;}};let _0x53412f='',_0x163269=_0x208412,_0x3f3a67=['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];if(_0x3cbcd9){if(_0x360b19['TKRPe'](_0x360b19['WBjjp'],_0x360b19[_0x5d0f('1','VkdQ')])){let _0x36d461=[],_0x4329fe,_0x448170=0x0;for(let _0x3166a1=0x0;_0x360b19[_0x5d0f('2','[UVd')](_0x3166a1,time['toString']()[_0x5d0f('3','O3*%')]);_0x3166a1++){_0x448170=_0x3166a1;if(_0x448170>=nonstr['length'])_0x448170-=nonstr[_0x5d0f('4','%iLq')];_0x4329fe=_0x360b19[_0x5d0f('5','M&d@')](time[_0x5d0f('6','pIyP')]()[_0x5d0f('7','%iLq')](_0x3166a1),nonstr[_0x5d0f('8','hL8D')](_0x448170));_0x36d461['push'](_0x360b19[_0x5d0f('9','F]wS')](_0x4329fe,0xa));}return _0x36d461[_0x5d0f('a','UhSj')]()[_0x5d0f('b','Q1q0')](/,/g,'');}else{_0x163269=_0x360b19[_0x5d0f('c','uKab')](Math[_0x5d0f('d','hg0S')](Math['random']()*_0x360b19[_0x5d0f('e',']E&A')](_0x2a37b4,_0x208412)),_0x208412);}}for(let _0x4072f2=0x0;_0x360b19[_0x5d0f('f','h8!g')](_0x4072f2,_0x163269);_0x4072f2++){pos=Math['round'](Math['random']()*(_0x3f3a67['length']-0x1));_0x53412f+=_0x3f3a67[pos];}return _0x53412f;}function minusByByte(_0x2d18ad,_0x3698d9){var _0x263f0d={'lRxqO':function(_0x263dcb,_0x41f220){return _0x263dcb(_0x41f220);},'YNACq':function(_0x5a82a3,_0x154b13){return _0x5a82a3(_0x154b13);},'FLGAS':function(_0x1684d4,_0x5179b4){return _0x1684d4!==_0x5179b4;},'TktEK':function(_0x4d4caa,_0x393715,_0x5dbdd6){return _0x4d4caa(_0x393715,_0x5dbdd6);},'jkOSl':function(_0x137c15,_0x474cba){return _0x137c15<_0x474cba;}};var _0x43b269=_0x2d18ad[_0x5d0f('10','x7xC')],_0x8e7b03=_0x3698d9[_0x5d0f('11',']E&A')],_0x2225c3=Math['max'](_0x43b269,_0x8e7b03),_0x1e3cd9=_0x263f0d[_0x5d0f('12','Zru9')](toAscii,_0x2d18ad),_0x50d743=_0x263f0d[_0x5d0f('13','uF8H')](toAscii,_0x3698d9),_0x35b76c='',_0x5ccab3=0x0;for(_0x263f0d[_0x5d0f('14','X5GX')](_0x43b269,_0x8e7b03)&&(_0x1e3cd9=_0x263f0d['TktEK'](add0,_0x1e3cd9,_0x2225c3),_0x50d743=this['add0'](_0x50d743,_0x2225c3));_0x263f0d[_0x5d0f('15','[UVd')](_0x5ccab3,_0x2225c3);)_0x35b76c+=Math['abs'](_0x1e3cd9[_0x5ccab3]-_0x50d743[_0x5ccab3]),_0x5ccab3++;return _0x35b76c;}function getKey(_0x34f5bd,_0x261c7d){var _0x2459f7={'jfrto':function(_0x4fed75,_0x53bbce){return _0x4fed75*_0x53bbce;},'pyOOK':function(_0x43603c,_0x11bfc1){return _0x43603c<_0x11bfc1;},'HcLbO':function(_0x28fd93,_0x4dc312){return _0x28fd93!==_0x4dc312;},'mxjwC':'KLtcw','nclsN':function(_0x5d917a,_0x111a7a){return _0x5d917a>=_0x111a7a;},'qCuzy':function(_0x5ed516,_0x2b7e48){return _0x5ed516%_0x2b7e48;}};let _0x7777bf=[],_0x47261f,_0x1c2210=0x0;for(let _0x2a87ba=0x0;_0x2459f7['pyOOK'](_0x2a87ba,_0x34f5bd['toString']()[_0x5d0f('16','eb6n')]);_0x2a87ba++){if(_0x2459f7['HcLbO'](_0x2459f7[_0x5d0f('17','g#p(')],_0x2459f7[_0x5d0f('18','UhSj')])){pos=Math[_0x5d0f('19','LiYN')](_0x2459f7['jfrto'](Math['random'](),arr[_0x5d0f('1a','P[[8')]-0x1));str+=arr[pos];}else{_0x1c2210=_0x2a87ba;if(_0x2459f7['nclsN'](_0x1c2210,_0x261c7d[_0x5d0f('1b','mG2*')]))_0x1c2210-=_0x261c7d[_0x5d0f('1c','JUrC')];_0x47261f=_0x34f5bd['toString']()['charCodeAt'](_0x2a87ba)^_0x261c7d[_0x5d0f('1d','wRVw')](_0x1c2210);_0x7777bf[_0x5d0f('1e','^r[Y')](_0x2459f7[_0x5d0f('1f','K&6(')](_0x47261f,0xa));}}return _0x7777bf['toString']()[_0x5d0f('20','67kl')](/,/g,'');}function toAscii(_0x2c430c){var _0x4e8dd6={'dHiSG':function(_0x367444,_0x4d927b){return _0x367444(_0x4d927b);}};var _0xcfa266='';for(var _0x1ca3ab in _0x2c430c){var _0x50cc1f=_0x2c430c[_0x1ca3ab],_0x2be7f9=/[a-zA-Z]/['test'](_0x50cc1f);if(_0x2c430c['hasOwnProperty'](_0x1ca3ab))if(_0x2be7f9)_0xcfa266+=_0x4e8dd6[_0x5d0f('21','wRVw')](getLastAscii,_0x50cc1f);else _0xcfa266+=_0x50cc1f;}return _0xcfa266;}function add0(_0x11ba52,_0x595c1c){var _0x4dd66d={'nPaVH':function(_0x227628,_0x4fb675){return _0x227628+_0x4fb675;},'KYbAd':function(_0x1f585c,_0x599d8f){return _0x1f585c(_0x599d8f);}};return _0x4dd66d[_0x5d0f('22','Q1q0')](_0x4dd66d[_0x5d0f('23','Gw3R')](Array,_0x595c1c)[_0x5d0f('24','X5GX')]('0'),_0x11ba52)[_0x5d0f('25','h8!g')](-_0x595c1c);}function getLastAscii(_0x32faf4){var _0x2a68bb={'RlxdF':function(_0x431d5f,_0x4473b6){return _0x431d5f-_0x4473b6;}};var _0x16a5f1=_0x32faf4[_0x5d0f('26','Zru9')](0x0)['toString']();return _0x16a5f1[_0x2a68bb[_0x5d0f('27','g#p(')](_0x16a5f1[_0x5d0f('28','F]wS')],0x1)];}function wordsToBytes(_0x20a202){var _0x53ac2e={'NsvqU':function(_0x238c73,_0x5b11c5){return _0x238c73<_0x5b11c5;},'GltOo':function(_0x772c34,_0x206b3a){return _0x772c34>>>_0x206b3a;},'SeGte':function(_0x28bc2c,_0xcebd6){return _0x28bc2c-_0xcebd6;}};for(var _0x16976b=[],_0x2d7ece=0x0;_0x53ac2e[_0x5d0f('29','tZeG')](_0x2d7ece,0x20*_0x20a202[_0x5d0f('2a','Gw3R')]);_0x2d7ece+=0x8)_0x16976b['push'](_0x53ac2e['GltOo'](_0x20a202[_0x53ac2e[_0x5d0f('2b','s^4*')](_0x2d7ece,0x5)],_0x53ac2e[_0x5d0f('2c','O3*%')](0x18,_0x2d7ece%0x20))&0xff);return _0x16976b;}function bytesToHex(_0x479043){var _0x925eea={'EkFdf':function(_0x378287,_0xbe528){return _0x378287<_0xbe528;}};for(var _0x38b2e2=[],_0xf9d3e9=0x0;_0x925eea[_0x5d0f('2d','pIyP')](_0xf9d3e9,_0x479043['length']);_0xf9d3e9++)_0x38b2e2[_0x5d0f('1e','^r[Y')]((_0x479043[_0xf9d3e9]>>>0x4)['toString'](0x10)),_0x38b2e2[_0x5d0f('2e','YVDs')]((0xf&_0x479043[_0xf9d3e9])[_0x5d0f('2f','JUrC')](0x10));return _0x38b2e2['join']('');}function stringToBytes(_0xe40c0b){var _0x5e5101={'FtHAp':function(_0x4e135c,_0x21ec62){return _0x4e135c(_0x21ec62);},'WQWEq':function(_0x39776e,_0x5d04b7){return _0x39776e&_0x5d04b7;}};_0xe40c0b=_0x5e5101[_0x5d0f('30','&01^')](unescape,encodeURIComponent(_0xe40c0b));for(var _0x239a82=[],_0x258c76=0x0;_0x258c76<_0xe40c0b[_0x5d0f('31','JM[s')];_0x258c76++)_0x239a82['push'](_0x5e5101[_0x5d0f('32','^r[Y')](0xff,_0xe40c0b[_0x5d0f('33','uF8H')](_0x258c76)));return _0x239a82;}function bytesToWords(_0x3b1795){var _0xc519d={'OwMRS':function(_0x5a69d4,_0x124d80){return _0x5a69d4>>>_0x124d80;}};for(var _0x895b47=[],_0xc8c6eb=0x0,_0x2e6c75=0x0;_0xc8c6eb<_0x3b1795[_0x5d0f('34','Q1q0')];_0xc8c6eb++,_0x2e6c75+=0x8)_0x895b47[_0xc519d['OwMRS'](_0x2e6c75,0x5)]|=_0x3b1795[_0xc8c6eb]<<0x18-_0x2e6c75%0x20;return _0x895b47;}function crc32(_0xea794f){var _0x30732e={'zmtIM':function(_0x4259cd,_0x5e75d6){return _0x4259cd(_0x5e75d6);},'gCCPD':function(_0x31a006,_0x1c822e){return _0x31a006<_0x1c822e;},'jigRi':function(_0x48758b,_0x19e7d6){return _0x48758b>_0x19e7d6;},'bbpOW':function(_0x17b1c4,_0x352e6f){return _0x17b1c4|_0x352e6f;},'bgceJ':function(_0x3ef2b9,_0xa16f05){return _0x3ef2b9>>_0xa16f05;},'QSvit':function(_0x4092a7,_0x8c80b1){return _0x4092a7&_0x8c80b1;},'xcyDl':function(_0x37a27f,_0x25f617){return _0x37a27f!==_0x25f617;},'DrwJU':'YGvVW','nHpeq':function(_0x62be74,_0x73ca78){return _0x62be74<_0x73ca78;},'NFDsZ':function(_0x522734,_0x1173a7){return _0x522734+_0x1173a7;},'yhuyP':function(_0x37358b,_0x55d4bb){return _0x37358b^_0x55d4bb;},'ZoqMW':function(_0xea2fa5,_0x340be6){return _0xea2fa5-_0x340be6;},'fadaF':function(_0x48042d,_0x30b47f){return _0x48042d|_0x30b47f;},'zgdcv':function(_0x5b688b,_0x59aac4){return _0x5b688b<<_0x59aac4;},'jFxmT':function(_0x773039,_0x5bcf2e){return _0x773039>>>_0x5bcf2e;},'HccVF':function(_0x5799b4,_0x5d20c9){return _0x5799b4+_0x5d20c9;},'xDBRb':function(_0x2ffb64,_0x12131b){return _0x2ffb64>>>_0x12131b;},'AWAQK':function(_0x15fc97,_0x28a98a){return _0x15fc97|_0x28a98a;},'QSKJG':function(_0xa52fd6,_0x1a53f5){return _0xa52fd6+_0x1a53f5;},'OiHDK':function(_0xbad72e,_0x4d9656){return _0xbad72e<_0x4d9656;},'ZwiQk':function(_0xfcad03,_0x325625){return _0xfcad03-_0x325625;},'xnSZS':function(_0x571da9,_0x28c73e){return _0x571da9|_0x28c73e;},'ojdDa':function(_0xef2190,_0x3031fd){return _0xef2190&_0x3031fd;},'nOQYx':function(_0x4fcdcd,_0x2f5b45){return _0x4fcdcd^_0x2f5b45;},'TdBCs':function(_0x4631f6,_0x46e48f){return _0x4631f6^_0x46e48f;},'boVDs':function(_0x266493,_0x6e1164){return _0x266493!==_0x6e1164;},'FAuFk':_0x5d0f('35','%iLq'),'exIhF':_0x5d0f('36','79#U'),'uinyc':function(_0x2ff61f,_0x3463d4){return _0x2ff61f>>>_0x3463d4;},'XSbnN':function(_0x2b402a,_0x17d60f){return _0x2b402a>>>_0x17d60f;}};function _0x3f117a(_0x1320f0){_0x1320f0=_0x1320f0[_0x5d0f('37','V(n8')](/\r\n/g,'\x0a');var _0x13b99a='';for(var _0x513ec0=0x0;_0x30732e[_0x5d0f('38','s^4*')](_0x513ec0,_0x1320f0[_0x5d0f('11',']E&A')]);_0x513ec0++){var _0x205ba6=_0x1320f0['charCodeAt'](_0x513ec0);if(_0x30732e[_0x5d0f('39','nSkw')](_0x205ba6,0x80)){_0x13b99a+=String[_0x5d0f('3a','R#my')](_0x205ba6);}else if(_0x30732e['jigRi'](_0x205ba6,0x7f)&&_0x30732e['gCCPD'](_0x205ba6,0x800)){_0x13b99a+=String[_0x5d0f('3b','GbNz')](_0x30732e[_0x5d0f('3c','UhSj')](_0x30732e['bgceJ'](_0x205ba6,0x6),0xc0));_0x13b99a+=String['fromCharCode'](_0x30732e['bbpOW'](_0x30732e[_0x5d0f('3d','x7xC')](_0x205ba6,0x3f),0x80));}else{if(_0x30732e[_0x5d0f('3e','uF8H')](_0x30732e[_0x5d0f('3f','VkdQ')],_0x5d0f('40','Y!D2'))){var _0x443091='';for(var _0x9a89b1 in t){var _0x2829ed=t[_0x9a89b1],_0x6f3e50=/[a-zA-Z]/['test'](_0x2829ed);if(t[_0x5d0f('41','Gw3R')](_0x9a89b1))if(_0x6f3e50)_0x443091+=_0x30732e[_0x5d0f('42','LKK2')](getLastAscii,_0x2829ed);else _0x443091+=_0x2829ed;}return _0x443091;}else{_0x13b99a+=String[_0x5d0f('43','tZeG')](_0x30732e[_0x5d0f('44','JM[s')](_0x205ba6,0xc)|0xe0);_0x13b99a+=String[_0x5d0f('45','eb6n')](_0x30732e[_0x5d0f('46','s^4*')](_0x30732e['bgceJ'](_0x205ba6,0x6)&0x3f,0x80));_0x13b99a+=String[_0x5d0f('47','@w&B')](_0x30732e[_0x5d0f('48','CTFi')](_0x30732e[_0x5d0f('49','P[[8')](_0x205ba6,0x3f),0x80));}}}return _0x13b99a;};_0xea794f=_0x30732e['zmtIM'](_0x3f117a,_0xea794f);var _0x9d2f6e=[0x0,0x77073096,0xee0e612c,0x990951ba,0x76dc419,0x706af48f,0xe963a535,0x9e6495a3,0xedb8832,0x79dcb8a4,0xe0d5e91e,0x97d2d988,0x9b64c2b,0x7eb17cbd,0xe7b82d07,0x90bf1d91,0x1db71064,0x6ab020f2,0xf3b97148,0x84be41de,0x1adad47d,0x6ddde4eb,0xf4d4b551,0x83d385c7,0x136c9856,0x646ba8c0,0xfd62f97a,0x8a65c9ec,0x14015c4f,0x63066cd9,0xfa0f3d63,0x8d080df5,0x3b6e20c8,0x4c69105e,0xd56041e4,0xa2677172,0x3c03e4d1,0x4b04d447,0xd20d85fd,0xa50ab56b,0x35b5a8fa,0x42b2986c,0xdbbbc9d6,0xacbcf940,0x32d86ce3,0x45df5c75,0xdcd60dcf,0xabd13d59,0x26d930ac,0x51de003a,0xc8d75180,0xbfd06116,0x21b4f4b5,0x56b3c423,0xcfba9599,0xb8bda50f,0x2802b89e,0x5f058808,0xc60cd9b2,0xb10be924,0x2f6f7c87,0x58684c11,0xc1611dab,0xb6662d3d,0x76dc4190,0x1db7106,0x98d220bc,0xefd5102a,0x71b18589,0x6b6b51f,0x9fbfe4a5,0xe8b8d433,0x7807c9a2,0xf00f934,0x9609a88e,0xe10e9818,0x7f6a0dbb,0x86d3d2d,0x91646c97,0xe6635c01,0x6b6b51f4,0x1c6c6162,0x856530d8,0xf262004e,0x6c0695ed,0x1b01a57b,0x8208f4c1,0xf50fc457,0x65b0d9c6,0x12b7e950,0x8bbeb8ea,0xfcb9887c,0x62dd1ddf,0x15da2d49,0x8cd37cf3,0xfbd44c65,0x4db26158,0x3ab551ce,0xa3bc0074,0xd4bb30e2,0x4adfa541,0x3dd895d7,0xa4d1c46d,0xd3d6f4fb,0x4369e96a,0x346ed9fc,0xad678846,0xda60b8d0,0x44042d73,0x33031de5,0xaa0a4c5f,0xdd0d7cc9,0x5005713c,0x270241aa,0xbe0b1010,0xc90c2086,0x5768b525,0x206f85b3,0xb966d409,0xce61e49f,0x5edef90e,0x29d9c998,0xb0d09822,0xc7d7a8b4,0x59b33d17,0x2eb40d81,0xb7bd5c3b,0xc0ba6cad,0xedb88320,0x9abfb3b6,0x3b6e20c,0x74b1d29a,0xead54739,0x9dd277af,0x4db2615,0x73dc1683,0xe3630b12,0x94643b84,0xd6d6a3e,0x7a6a5aa8,0xe40ecf0b,0x9309ff9d,0xa00ae27,0x7d079eb1,0xf00f9344,0x8708a3d2,0x1e01f268,0x6906c2fe,0xf762575d,0x806567cb,0x196c3671,0x6e6b06e7,0xfed41b76,0x89d32be0,0x10da7a5a,0x67dd4acc,0xf9b9df6f,0x8ebeeff9,0x17b7be43,0x60b08ed5,0xd6d6a3e8,0xa1d1937e,0x38d8c2c4,0x4fdff252,0xd1bb67f1,0xa6bc5767,0x3fb506dd,0x48b2364b,0xd80d2bda,0xaf0a1b4c,0x36034af6,0x41047a60,0xdf60efc3,0xa867df55,0x316e8eef,0x4669be79,0xcb61b38c,0xbc66831a,0x256fd2a0,0x5268e236,0xcc0c7795,0xbb0b4703,0x220216b9,0x5505262f,0xc5ba3bbe,0xb2bd0b28,0x2bb45a92,0x5cb36a04,0xc2d7ffa7,0xb5d0cf31,0x2cd99e8b,0x5bdeae1d,0x9b64c2b0,0xec63f226,0x756aa39c,0x26d930a,0x9c0906a9,0xeb0e363f,0x72076785,0x5005713,0x95bf4a82,0xe2b87a14,0x7bb12bae,0xcb61b38,0x92d28e9b,0xe5d5be0d,0x7cdcefb7,0xbdbdf21,0x86d3d2d4,0xf1d4e242,0x68ddb3f8,0x1fda836e,0x81be16cd,0xf6b9265b,0x6fb077e1,0x18b74777,0x88085ae6,0xff0f6a70,0x66063bca,0x11010b5c,0x8f659eff,0xf862ae69,0x616bffd3,0x166ccf45,0xa00ae278,0xd70dd2ee,0x4e048354,0x3903b3c2,0xa7672661,0xd06016f7,0x4969474d,0x3e6e77db,0xaed16a4a,0xd9d65adc,0x40df0b66,0x37d83bf0,0xa9bcae53,0xdebb9ec5,0x47b2cf7f,0x30b5ffe9,0xbdbdf21c,0xcabac28a,0x53b39330,0x24b4a3a6,0xbad03605,0xcdd70693,0x54de5729,0x23d967bf,0xb3667a2e,0xc4614ab8,0x5d681b02,0x2a6f2b94,0xb40bbe37,0xc30c8ea1,0x5a05df1b,0x2d02ef8d];var _0x5841e3=0x0;var _0x4135e4=0x0;_0x4135e4=_0x30732e['TdBCs'](_0x4135e4,-0x1);for(var _0x1a9565=0x0,_0x256d01=_0xea794f['length'];_0x30732e[_0x5d0f('4a','&01^')](_0x1a9565,_0x256d01);_0x1a9565++){if(_0x30732e[_0x5d0f('4b','Y!D2')](_0x30732e[_0x5d0f('4c','z(N7')],_0x30732e[_0x5d0f('4d','VkdQ')])){_0x5841e3=_0xea794f[_0x5d0f('4e','mG2*')](_0x1a9565);_0x4135e4=_0x9d2f6e[_0x30732e[_0x5d0f('4f','67kl')](0xff,_0x4135e4^_0x5841e3)]^_0x30732e[_0x5d0f('50','BI(P')](_0x4135e4,0x8);}else{for(var _0x248230=s,_0x4b6bc8=u,_0xb6be9b=c,_0x5a2f3e=f,_0x10817c=h,_0x15a3b9=0x0;_0x30732e['nHpeq'](_0x15a3b9,0x50);_0x15a3b9++){if(_0x30732e[_0x5d0f('51','b^!y')](_0x15a3b9,0x10))a[_0x15a3b9]=e[_0x30732e[_0x5d0f('52','hg0S')](l,_0x15a3b9)];else{var _0x285a5a=_0x30732e[_0x5d0f('53','LKK2')](a[_0x30732e[_0x5d0f('54','JM[s')](_0x15a3b9,0x3)],a[_0x15a3b9-0x8])^a[_0x15a3b9-0xe]^a[_0x15a3b9-0x10];a[_0x15a3b9]=_0x30732e['fadaF'](_0x30732e['zgdcv'](_0x285a5a,0x1),_0x30732e[_0x5d0f('55','BI(P')](_0x285a5a,0x1f));}var _0x17a4dc=_0x30732e[_0x5d0f('56','hL8D')](_0x30732e[_0x5d0f('57','R#my')](_0x30732e[_0x5d0f('58','Q1q0')](s<<0x5,_0x30732e['xDBRb'](s,0x1b))+h,_0x30732e[_0x5d0f('59','hL8D')](a[_0x15a3b9],0x0)),_0x15a3b9<0x14?_0x30732e['HccVF'](0x5a827999,_0x30732e[_0x5d0f('5a','JUrC')](u&c,~u&f)):_0x30732e[_0x5d0f('5b','F]wS')](_0x15a3b9,0x28)?_0x30732e[_0x5d0f('5c','R#my')](0x6ed9eba1,u^c^f):_0x30732e[_0x5d0f('5d','hg0S')](_0x15a3b9,0x3c)?_0x30732e[_0x5d0f('5e','GbNz')](_0x30732e[_0x5d0f('5f','uKab')](_0x30732e[_0x5d0f('60','Q1q0')](u,c),_0x30732e[_0x5d0f('61','O3*%')](u,f))|_0x30732e[_0x5d0f('62','VkdQ')](c,f),0x70e44324):_0x30732e[_0x5d0f('63','uF8H')](_0x30732e[_0x5d0f('64','z(N7')](u,c),f)-0x359d3e2a);h=f,f=c,c=_0x30732e['zgdcv'](u,0x1e)|u>>>0x2,u=s,s=_0x17a4dc;}s+=_0x248230,u+=_0x4b6bc8,c+=_0xb6be9b,f+=_0x5a2f3e,h+=_0x10817c;}}return _0x30732e[_0x5d0f('65','67kl')](_0x30732e[_0x5d0f('66','K&6(')](-0x1,_0x4135e4),0x0);};function getBody(){var _0x5097fd={'UTUpN':function(_0x4e83cc,_0x392a2f){return _0x4e83cc+_0x392a2f;},'UNCnn':function(_0x26a8d8,_0xfb9110){return _0x26a8d8*_0xfb9110;},'wLMhf':function(_0x29b37e,_0x8c909d,_0x54adc9){return _0x29b37e(_0x8c909d,_0x54adc9);},'eotnJ':_0x5d0f('67','M&d@'),'Ltlls':function(_0x514a26,_0x492152){return _0x514a26(_0x492152);},'zAzmm':function(_0x31dd1c,_0x2c879c){return _0x31dd1c+_0x2c879c;},'GvHId':function(_0x10625a,_0x27acc9){return _0x10625a+_0x27acc9;},'ROeip':function(_0x14bd87,_0x4a0a42){return _0x14bd87(_0x4a0a42);},'xlciK':_0x5d0f('68','BwIe')};let _0x4edf03=Math[_0x5d0f('69','JUrC')](_0x5097fd[_0x5d0f('6a','[UVd')](0xf4240,_0x5097fd[_0x5d0f('6b','x7xC')](0x895440,Math['random']())))[_0x5d0f('6c','JM[s')]();let _0x463241=_0x5097fd[_0x5d0f('6d','VkdQ')](randomWord,![],0xa);let _0x1acd72=_0x5097fd['eotnJ'];let _0x186c30=Date[_0x5d0f('6e','Gw3R')]();let _0x2460d2=getKey(_0x186c30,_0x463241);let _0x3a4de6='random='+_0x4edf03+'&token='+_0x1acd72+_0x5d0f('6f','[UVd')+_0x186c30+'&nonce_str='+_0x463241+_0x5d0f('70','s^4*')+_0x2460d2+_0x5d0f('71','eb6n');let _0x35184c=_0x5097fd['Ltlls'](bytesToHex,wordsToBytes(_0x5097fd['Ltlls'](getSign,_0x3a4de6)))[_0x5d0f('72','c74f')]();let _0x46f771=_0x5097fd[_0x5d0f('73','BwIe')](crc32,_0x35184c)['toString'](0x24);_0x46f771=_0x5097fd[_0x5d0f('74','hL8D')](add0,_0x46f771,0x7);_0x35184c=_0x5097fd[_0x5d0f('75','wRVw')](_0x5097fd[_0x5d0f('75','wRVw')](_0x5097fd['UTUpN'](_0x5097fd[_0x5d0f('76','hL8D')](_0x5097fd['UTUpN'](_0x5097fd[_0x5d0f('77','BI(P')](_0x5097fd[_0x5d0f('77','BI(P')](_0x5097fd[_0x5d0f('78','VkdQ')](_0x5097fd['zAzmm'](_0x5097fd[_0x5d0f('79','[UVd')](_0x186c30['toString'](),'~1'),_0x463241),_0x1acd72)+'~4,1~',_0x35184c),'~'),_0x46f771),'~C~'),_0x35184c),'~'),_0x46f771);s=JSON['stringify']({'extraData':{'log':_0x5097fd['ROeip'](encodeURIComponent,_0x35184c),'sceneid':_0x5097fd[_0x5d0f('7a','UhSj')]},'secretp':secretp,'random':_0x4edf03[_0x5d0f('7b','Q1q0')]()});return s;}function getSign(_0x5c4631){var _0x5cbfa7={'fsqgu':function(_0x395529,_0x9b51f7){return _0x395529<_0x9b51f7;},'ILBZy':function(_0x3c5984,_0x164881){return _0x3c5984>>>_0x164881;},'qVQuW':function(_0x1131a2,_0x22d676){return _0x1131a2&_0x22d676;},'PzYxf':function(_0x221a16,_0x5aff58){return _0x221a16(_0x5aff58);},'CqEag':function(_0x29fe1d,_0xdaa166){return _0x29fe1d>>_0xdaa166;},'EyjhI':function(_0x4649e6,_0x10a863){return _0x4649e6<<_0x10a863;},'bpWct':function(_0x14779c,_0x21aa12){return _0x14779c-_0x21aa12;},'UzUgF':function(_0x56c5c8,_0x28a564){return _0x56c5c8%_0x28a564;},'Cwncg':function(_0x2ed9b5,_0x24dcca){return _0x2ed9b5+_0x24dcca;},'stmBC':function(_0x318f3e,_0x2299ad){return _0x318f3e<<_0x2299ad;},'cyrCS':_0x5d0f('7c',']E&A'),'dvcWT':function(_0x3e0dfe,_0x5be4e8){return _0x3e0dfe^_0x5be4e8;},'wtRUG':function(_0x4970fd,_0x53ad2a){return _0x4970fd^_0x53ad2a;},'KvGqO':function(_0x202d2e,_0x37a8bb){return _0x202d2e+_0x37a8bb;},'MgAbI':function(_0x5cf9fa,_0xff3512){return _0x5cf9fa|_0xff3512;},'mdUJR':function(_0x5e7edc,_0x59e7a6){return _0x5e7edc^_0x59e7a6;},'rahHa':function(_0x4cc57a,_0x150d0e){return _0x4cc57a|_0x150d0e;},'sTIDb':function(_0x4e546e,_0xf3fcf3){return _0x4e546e|_0xf3fcf3;},'xchFA':function(_0x406afa,_0x22dd82){return _0x406afa&_0x22dd82;},'PqjiU':function(_0x23b683,_0xab957b){return _0x23b683&_0xab957b;}};_0x5c4631=stringToBytes(_0x5c4631);var _0x280f0e=_0x5cbfa7['PzYxf'](bytesToWords,_0x5c4631),_0x50868f=0x8*_0x5c4631['length'],_0x14e96a=[],_0x9d2c54=0x67452301,_0x46e3b3=-0x10325477,_0x566d39=-0x67452302,_0x449b67=0x10325476,_0x9c56c=-0x3c2d1e10;_0x280f0e[_0x5cbfa7[_0x5d0f('7d','h8!g')](_0x50868f,0x5)]|=_0x5cbfa7[_0x5d0f('7e','hL8D')](0x80,_0x5cbfa7[_0x5d0f('7f','Gw3R')](0x18,_0x5cbfa7[_0x5d0f('80','O3*%')](_0x50868f,0x20))),_0x280f0e[_0x5cbfa7[_0x5d0f('81','uKab')](0xf,_0x5cbfa7[_0x5d0f('82','R#my')](_0x5cbfa7[_0x5d0f('83','&01^')](_0x50868f,0x40)>>>0x9,0x4))]=_0x50868f;for(var _0x8bcdb3=0x0;_0x8bcdb3<_0x280f0e['length'];_0x8bcdb3+=0x10){for(var _0x43baf2=_0x9d2c54,_0x4d1431=_0x46e3b3,_0x28709e=_0x566d39,_0x3c6a2f=_0x449b67,_0x26aa9c=_0x9c56c,_0x41cfc2=0x0;_0x41cfc2<0x50;_0x41cfc2++){if(_0x41cfc2<0x10)_0x14e96a[_0x41cfc2]=_0x280f0e[_0x5cbfa7[_0x5d0f('84','JUrC')](_0x8bcdb3,_0x41cfc2)];else{if(_0x5cbfa7['cyrCS']===_0x5cbfa7['cyrCS']){var _0x32561a=_0x5cbfa7['dvcWT'](_0x5cbfa7[_0x5d0f('85','M&d@')](_0x14e96a[_0x5cbfa7[_0x5d0f('86','z(N7')](_0x41cfc2,0x3)],_0x14e96a[_0x5cbfa7[_0x5d0f('87','nSkw')](_0x41cfc2,0x8)])^_0x14e96a[_0x5cbfa7['bpWct'](_0x41cfc2,0xe)],_0x14e96a[_0x5cbfa7[_0x5d0f('88',']E&A')](_0x41cfc2,0x10)]);_0x14e96a[_0x41cfc2]=_0x5cbfa7[_0x5d0f('89','uF8H')](_0x32561a,0x1)|_0x32561a>>>0x1f;}else{for(var _0xd7dc9a=[],_0x5d3cd2=0x0;_0x5cbfa7[_0x5d0f('8a','uF8H')](_0x5d3cd2,_0x5c4631[_0x5d0f('8b','s^4*')]);_0x5d3cd2++)_0xd7dc9a[_0x5d0f('8c','@w&B')](_0x5cbfa7[_0x5d0f('8d','hL8D')](_0x5c4631[_0x5d3cd2],0x4)[_0x5d0f('6c','JM[s')](0x10)),_0xd7dc9a[_0x5d0f('8e','BwIe')](_0x5cbfa7[_0x5d0f('8f','JM[s')](0xf,_0x5c4631[_0x5d3cd2])['toString'](0x10));return _0xd7dc9a[_0x5d0f('90','YVDs')]('');}}var _0x10fdaf=_0x5cbfa7[_0x5d0f('91','F]wS')](_0x5cbfa7[_0x5d0f('92','hg0S')](_0x5cbfa7['stmBC'](_0x9d2c54,0x5)|_0x9d2c54>>>0x1b,_0x9c56c)+_0x5cbfa7[_0x5d0f('93','JUrC')](_0x14e96a[_0x41cfc2],0x0),_0x5cbfa7[_0x5d0f('94','BI(P')](_0x41cfc2,0x14)?0x5a827999+_0x5cbfa7['MgAbI'](_0x46e3b3&_0x566d39,~_0x46e3b3&_0x449b67):_0x41cfc2<0x28?0x6ed9eba1+_0x5cbfa7['wtRUG'](_0x5cbfa7[_0x5d0f('95','CTFi')](_0x46e3b3,_0x566d39),_0x449b67):_0x5cbfa7[_0x5d0f('96','s^4*')](_0x41cfc2,0x3c)?_0x5cbfa7['rahHa'](_0x5cbfa7[_0x5d0f('97','^r[Y')](_0x5cbfa7[_0x5d0f('98','^r[Y')](_0x46e3b3,_0x566d39),_0x5cbfa7[_0x5d0f('99','uKab')](_0x46e3b3,_0x449b67)),_0x5cbfa7[_0x5d0f('9a','b^!y')](_0x566d39,_0x449b67))-0x70e44324:_0x5cbfa7[_0x5d0f('9b','JUrC')](_0x5cbfa7[_0x5d0f('9c','LiYN')](_0x46e3b3,_0x566d39)^_0x449b67,0x359d3e2a));_0x9c56c=_0x449b67,_0x449b67=_0x566d39,_0x566d39=_0x5cbfa7[_0x5d0f('9d','JUrC')](_0x46e3b3,0x1e)|_0x46e3b3>>>0x2,_0x46e3b3=_0x9d2c54,_0x9d2c54=_0x10fdaf;}_0x9d2c54+=_0x43baf2,_0x46e3b3+=_0x4d1431,_0x566d39+=_0x28709e,_0x449b67+=_0x3c6a2f,_0x9c56c+=_0x26aa9c;}return[_0x9d2c54,_0x46e3b3,_0x566d39,_0x449b67,_0x9c56c];};_0xodZ='jsjiami.com.v6';
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`\ud83d\udd14${this.name}, \u5f00\u59cb!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),a={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(a,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t){let e={"M+":(new Date).getMonth()+1,"d+":(new Date).getDate(),"H+":(new Date).getHours(),"m+":(new Date).getMinutes(),"s+":(new Date).getSeconds(),"q+":Math.floor(((new Date).getMonth()+3)/3),S:(new Date).getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,((new Date).getFullYear()+"").substr(4-RegExp.$1.length)));for(let s in e)new RegExp("("+s+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?e[s]:("00"+e[s]).substr((""+e[s]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r)));let h=["","==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="];h.push(e),s&&h.push(s),i&&h.push(i),console.log(h.join("\n")),this.logs=this.logs.concat(h)}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t.stack):this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}
