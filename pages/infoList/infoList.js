// pages/infoList/infoList.js
const {
  $api,
  $interface
} = wx
const app = getApp()
Page({
  data: {
    BlowerExce: $interface.BlowerExce,
    page: 1,
    PageSize: 10,
    start: '', //默认今天之前的一个月
    end: '',
    min: '1970-01-01', //最小值不计
    max: '', //最大值取当前时间后一年
    listData: [],
    flag: true, //获取列表避免重复请求
    search: ''
  },
  download(e) { //下载按钮
    let zfid = e.currentTarget.dataset.zfid
    $api.loading()
    $api.request($interface.GetExcelFileStr, {
        ZfId: zfid
      }).then(res => {
        $api.hide()
        if (res.data.res) {
          wx.downloadFile({
            url: this.data.BlowerExce + res.data.filename,
            success(res) {
              console.log(res)
              if (res.statusCode === 200) {
                wx.openDocument({
                  filePath: res.tempFilePath,
                  success: function(res) {

                  }
                })
              }
            }
          })
        } else {
          $api.showToast('失败')
        }
        wx.stopPullDownRefresh()
      })
      .catch(() => this.data.flag = true && $api.hide)
  },
  input(e) {
    this.data.search = e.detail.value
  },
  startChange(e) {
    this.setData({
      start: e.detail.value
    })
  },
  endChange(e) {
    this.setData({
      end: e.detail.value
    })
  },
  toCompressorInfoList(e) { //跳转至压缩机列表页
    wx.navigateTo({
      url: `/pages/compressorInfoList/compressorInfoList?zfId=${e.currentTarget.dataset.zfid}`
    })
  },
  toCreateWorkshopInfo(str) { //跳转至添加站房信息页
    typeof str === 'string' || (str = '')
    wx.navigateTo({
      url: `/pages/createWorkshopInfo/createWorkshopInfo${str}`
    })
  },
  revise(e) {
    this.toCreateWorkshopInfo(`?zfId=${e.currentTarget.dataset.zfid}`)
  },
  initTime() { //初始化时间
    const currentDate = new Date().getTime()
    this.setData({
      start: this.reverseTime(currentDate - 2592000000), //一月前
      end: this.reverseTime(currentDate),
      max: this.reverseTime(currentDate + 31536000000) //一年后
    })
    this.getList()
  },
  reverseTime(time) {
    let obj = $api.timeStamp(time)
    return `${obj.y}-${obj.m}-${obj.d}`
  },
  judgeTime(start, end) { //判断结束时间是否大于开始时间
    return $api.newDate(`${end} 00:00:00`).getTime() - $api.newDate(`${start} 00:00:00`).getTime() > 0
  },
  getListsearch(){//搜索
    this.data.listData=[];
    this.data.page=1;
    this.getList()
  },
  getList() {
    let {
      start,
      end,
      flag,
      search,
      page,
      PageSize
    } = this.data
    if (!flag) return
    this.data.flag = false
    //保证开始时间小于结束时间 [start, end] = [end, start] es6用法
    if (!this.judgeTime(start, end)) start = [end, end = start][0]
    $api.loading()
    $api.request($interface.BlowerList, {
        page,
        PageSize,
        start,
        end,
        openid: wx.getStorageSync('openid'),
        Search: search,
      })
      .then(res => {
        $api.hide()
        this.data.flag = true
        let data = res.data;
        let listData = this.data.listData;
        listData = listData.concat(data.List);
        this.setData({
          listData: $api.unique(listData, 'zfId')
        })
        this.data.page++
          wx.stopPullDownRefresh()
      })
      .catch(() => this.data.flag = true && $api.hide)
  },
  backShow() { //处理添加或修改后本页面回显
    let data = app.reviseWorkData
    if (data) { //修改
      let {
        listData
      } = this.data
      let index = -1
      for (let i = 0, len = listData.length; i < len; i++) {
        if (listData[i].zfId = data.zfId) {
          index = i
          break
        }
      }
      if (index !== -1) {
        let key = `listData[${index}]`
        this.setData({
          [key]: data
        })
      }
    } else { //添加
      this.getList()
    }
    app.reviseWorkData = null
  },
  toInfoList() {
    wx.redirectTo({
      url: '/pages/login/login'
    })
  },
  GetIsRegister() {
    $api.request($interface.GetIsRegister, {
      openid: wx.getStorageSync('openid'),
    }).then(res => {
      if (!res.data.res) this.toInfoList()
    })
  },
  onLoad: function(options) {
    // $api.getOpenId().then((res) => {
    // })
  },
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    this.data.page = 1;
    $api.getOpenId().then((res) => {
      this.initTime()
      this.backShow()
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    this.data.page = 1;
    this.getList()
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {
    this.getList()
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {
    // return $api.share()
  }
})