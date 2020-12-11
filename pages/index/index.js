//index.js

import { formatTime } from '../../utils/util'

//获取应用实例
const app = getApp()
const date = new Date;
// date.setDate(date.getDate() + 2);
const today = formatTime(date, { dateOnly: true, dateSeparator: '-' });

const treatments = [
  {
    name: '治疗雄激素导致脂溢性脱发',
    prescriptions: [
      {
        name: 'VE',
        timesPerDay: 1,
      },
      {
        name: 'VB6',
        timesPerDay: 3,
      },
      {
        name: '葡萄糖酸锌颗粒',
        timesPerDay: 2,
      },
      {
        name: '苁蓉益肾颗粒',
        timesPerDay: 2,
      },
    ],
  }
];

const defaultUsages = treatments[0].prescriptions.map(({ name, timesPerDay }) => ({
  name,
  dosages: new Array(timesPerDay).fill(false),
}));

const defaultRecords = {
  [today]: defaultUsages,
};

let timer;

Page({
  data: {
    /**
     * @type {{ origin: { dynasty: string; author: string; content: string[] } }}
    */
    poem: {},
    userInfo: {},
    isLoadingUserInfo: true,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),

    /**
     * @type {{ name: string; prescriptions: { name: string; timesPerDay: number }[] }[]}
     */
    treatments: [],
    records: {},
    defaultUsages,
    date: today,
    today,
    firstRecordedDate: '',
  },

  onPullDownRefresh() {
    this.refreshPoem();
  },

  //事件处理函数
  onDateChange({ detail: { value: date } }) {
    this.setData({
      date,
      completed: this.isCompleted(this.data.records, date),
      // usages: this.data.records[date],
    });
  },

  onTreatmentAdd() {

  },

  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },

  isCompleted: (records, date) => {
    const usages = records[date];

    const completed = !!usages && usages.every(({ dosages }) =>
      dosages.every(Boolean)
    );

    // console.log('isCompleted', date, records, completed);

    if (completed) {
      wx.vibrateShort();
    }
    
    return completed;
  },

  onDosageTap({ target: { dataset: { medicineIndex, dosageIndex } } }) {
    const { records, date } = this.data;

    if (!records[date]) {
      records[date] = defaultUsages;
    }

    const usages = records[date];
    const dosages = usages[medicineIndex].dosages;

    dosages[dosageIndex] = !dosages[dosageIndex];

    console.log('save records', records)

    this.setData({
      records,
      completed: this.isCompleted(records, date),
    });

    wx.setStorage({
      key: 'records',
      data: records,

      success: (res) => {
        console.log('setStorage records success:', res)
      },
      fail: (res) => {
        console.log('setStorage records failed:', res)
      },
    })
  },

  onHide(){
    this.isShow = false;
  },
  onShow(){
    this.isShow = true;
  },

  async onLoad() {
    console.log(treatments)
    this.setData({ treatments });

    wx.onAccelerometerChange((e) => {
      if (!this.isShow) { return; }

      const shaked = Math.abs(e.x) > 1 && Math.abs(e.y) > 1
      console.log(Math.abs(e.x) > 1, Math.abs(e.y) > 1, Math.abs(e.z) > 1, shaked)
    
      if (shaked) {
        wx.vibrateShort(),
        this.debouncedRefreshPoem();
          // wx.showToast({
          //   title: '摇一摇成功',
          //   icon: 'success',
          //   duration: 2000
          // })
      }
    })

    wx.getStorage({
      key: 'records',
      success: res => {
        console.log('getStorage records success', res);
        const records = res.data || defaultRecords;

        this.setData({
          records,
          completed: this.isCompleted(records, this.data.date),
          firstRecordedDate: Object.keys(records)[0],
        })
      },
      fail: error => {
        console.warn('getStorage records failed fallback to defaultRecords', error)

        const records = defaultRecords;

        // console.log('records[this.data.date]', records[this.data.date])

        this.setData({ records, firstRecordedDate: Object.keys(records)[0] })
      },
    })

    // this.setData({
    //   records,
    //   usages: records[this.data.date],
    // });

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

  onPoemClick() {
    const { nCharacters, poem, isShi } = this.data;

    const data = {
      // 每一句话字数都相等，则认为是“诗”，否则是“词”
      isShi,
      nCharacters,
      // 词不做断句，否则不好阅读
      splitContent: poem.origin.content, // isShi ? splitContent.map(sentence => `${sentence}。`) : content,
    }

    const MAX_CHARACTER_COUNT = 290;

    if (nCharacters > MAX_CHARACTER_COUNT) {
      wx.navigateTo({
        url: '../poem/index',
        success: function(res) {
          // 通过eventChannel向被打开页面传送数据
          res.eventChannel.emit('dataFromHome', { data: { ...data, poem } })
        }
      })

      return;
    }

    return this.setData({ ...data, showModal: true, });

    // wx.showActionSheet({
    //   itemList: [`${dynasty} · ${author}`, ...splitContent],
    //   fail: (error) => {
    //     console.log('showActionSheet', error)

    //     return this.setData({
    //       // 每一句话字数都相等，则认为是“诗”，否则是“词”
    //       isShi,
    //       showModal: true,
    //       // 词不做断句，否则不好阅读
    //       splitContent: isShi ? splitContent.map(sentence => `${sentence}。`) : content,
    //     });
    //   }
    // })
  },

  hideModal() {
    this.setData({ showModal: false })
  },

  async debouncedRefreshPoem() {
    if (timer) { clearTimeout(timer) }

    timer = setTimeout(() => {
      this.refreshPoem();
    }, 200);
  },

  async refreshPoem() {
    let poem;
    let fetching = true;
    
    setTimeout(() => {
      fetching && wx.showLoading({
        title: '诗词加载中……',
      })
    }, 300);

    console.log('fetchPoem start', Date.now());

    try {
      poem = await this.fetchPoem({ timeout: 1000 });
    } catch (error) {
      console.error('fetchPoem', error);
      wx.showToast({
        title: error.message || JSON.stringify(error),
      })
    } finally {
      console.log('fetchPoem end', Date.now());
      fetching = false;
      wx.hideLoading()
    }

    if (!poem) {
      return;
    }

    const formatted = {
      ...poem,

      content: poem.content.replace(/。$/, ''),
      origin: {
        ...poem.origin,
        title: `${poem.origin.title}`,
      },
    };

    const { content } = poem.origin;
    
    /** @type {string[]} */
    const splitContent = content
      .reduce((acc, sentence) => acc.concat(sentence.trim().split(/[。！，？]/)), [])
      .filter(Boolean)

    const isShi = splitContent.every(sentence => sentence.length === splitContent[0].length);
    const nCharacters = content.reduce((acc, cur) => acc + cur.length, 0);
    
    console.log('content', content)
    console.log('splitContent', splitContent)
    console.log('isShi', isShi)
    console.log('nCharacters', nCharacters)

    const data = {
      // 每一句话字数都相等，则认为是“诗”，否则是“词”
      isShi,
      nCharacters,
      // 词不做断句，否则不好阅读
      splitContent: content, // isShi ? splitContent.map(sentence => `${sentence}。`) : content,
    }

    this.setData({
      poem: formatted,

      ...data,
    });
  },

  fetchPoem({ timeout = 5000 } = {}) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error(`timeout for ${timeout}ms`))
      }, timeout);

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
