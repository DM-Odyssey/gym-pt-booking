Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: '/pages/index/index',
        text: '首页',
        iconPath: '/images/tabbar/home.png',
        selectedIconPath: '/images/tabbar/home_cur.png'
      },
      {
        pagePath: '/pages/news/list/news_list',
        text: '公告',
        iconPath: '/images/tabbar/news.png',
        selectedIconPath: '/images/tabbar/news_cur.png'
      },
      {
        pagePath: '/pages/meet/calendar/meet_calendar',
        text: '课程日历',
        iconPath: '/images/tabbar/day.png',
        selectedIconPath: '/images/tabbar/day_cur.png'
      },
      {
        pagePath: '/pages/my/index/my_index',
        text: '我的',
        iconPath: '/images/tabbar/my.png',
        selectedIconPath: '/images/tabbar/my_cur.png'
      }
    ]
  },

  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset;
      const url = data.path;
      wx.switchTab({ url });
    }
  }
});
