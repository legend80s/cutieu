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

Page({
  data: {
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
      completed: usages.every(({ dosages }) => dosages.every(Boolean)),
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

  async onLoad() {
    console.log(treatments)
    this.setData({ treatments });

    wx.getStorage({
      key: 'records',
      success: res => {
        console.log('getStorage records success', res);
        const records = res.data || defaultRecords;
        const completed = records[this.data.date].every(({ dosages }) =>
          dosages.every(Boolean)
        );

        this.setData({
          records,
          completed,
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

  async refreshPoem() {
    let poem;

    try {
      poem = await this.fetchPoem();
    } catch (error) {
      console.error('fetchPoem', error);
    }

    poem && this.setData({
      poem: {
        ...poem,
        content: poem.content.replace(/。$/, ''),
        origin: {
          ...poem.origin,
          title: `《${poem.origin.title}》`,
        }
      },
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
