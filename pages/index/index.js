//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    poem: {},
    userInfo: {},
    isLoadingUserInfo: true,
    canIUse: wx.canIUse('button.open-type.getUserInfo')
  },
  onPullDownRefresh() {
    this.refreshPoem();
  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },

  async onLoad() {
    // console.log('app.globalData.userInfo', app.globalData.userInfo);
    // console.log('this.data.canIUse', this.data.canIUse);
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        isLoadingUserInfo: false,
      })
    } else if (this.data.canIUse){
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        console.log('app.userInfoReadyCallback res', res);
        this.setData({
          userInfo: res.userInfo,
          isLoadingUserInfo: false,
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            isLoadingUserInfo: false,
          })
        }
      })
    }

    this.refreshPoem();
  },

  async refreshPoem() {
    let poem;

    try {
      poem = await this.fetchPoem();
    } catch (error) {
      console.error('fetchPoem', error);
    }

    poem && this.setData({
      poem: { ...poem, content: poem.content.replace(/。$/, '') },
    });
  },

  fetchPoem() {
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'https://v2.jinrishici.com/one.json?client=npm-sdk/1.0&X-User-Token=6aeojNJwnJmAljhWJUljmPsIpv1K08ub',
        success(res) {
          resolve(res.data.data);
        },
        fail(error) {
          reject(error);
        }
      })
    });
  },

  getUserInfo: function(e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      isLoadingUserInfo: false,
    })
  }
})
