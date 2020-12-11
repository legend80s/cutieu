//logs.js
const util = require('../../utils/util.js')

Page({
  data: {
    isShi: false,
    nCharacters: 0,
    splitContent: [],
    poem: {},
  },
  
  onLoad: function () {
    const eventChannel = this.getOpenerEventChannel()

    eventChannel.on('dataFromHome', ({ data }) => {
      console.log(data);

      this.setData({ ...data })
    })
  }
})
