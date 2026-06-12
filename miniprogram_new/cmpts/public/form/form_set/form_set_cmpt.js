const pageHelper = require('../../../../utils/index.js');
const dataHelper = require('../../../../utils/data.js');

Component({
	options: {
		addGlobalClass: true,
		styleIsolation: 'shared',
	},

	/**
	 * 组件的属性列表
	 */
	properties: {
		fields: {
			type: Array,
			value: [],
			observer: function(newVal) {
				// 运行时父组件更新 fields 时同步到 data
				if (newVal && newVal.length > 0) this.setData({ fields: newVal });
			},
		},
	},

	/**
	 * 组件的初始数据
	 */
	data: {
		cur: -1,
	},

	/**
	 * 生命周期方法
	 */
	lifetimes: {
		attached: function () {
			// 防御：组件初次创建时 observer 可能在 created 阶段触发，
			// 彼时 setData 不可用导致 data.fields 未同步，在 attached 补同步
			var propFields = this.properties.fields;
			if (propFields && propFields.length > 0) {
				var dataFields = this.data.fields;
				if (!dataFields || dataFields.length === 0) {
					this.setData({ fields: propFields });
				}
			}
		},

		ready: function () {


		},

		detached: function () {
			// 在组件实例被从页面节点树移除时执行
		},
	},

	/**
	 * 组件的方法列表
	 */
	methods: {
		setGlow(cur) {
			this.setData({
				cur
			});
			setTimeout(() => {
				this.setData({
					cur: -1
				});
			}, 800);
		},

		url: function (e) {
			pageHelper.url(e, this);
		},

		set: function (fields) {
			this.setData({
				fields
			});
			this.triggerEvent('formset', fields);
		},

		get: function () {
			return this.data.fields;
		},

		bindEditTap: function (e) {
			let idx = pageHelper.dataset(e, 'idx');
			let edit = pageHelper.dataset(e, 'edit');
			if (!edit) {
				return pageHelper.showNoneToast('该字段不可编辑和删除');
			}
			wx.navigateTo({
				url: '/cmpts/public/form/form_set/field/form_set_field?idx=' + idx,
			});
		},
		bindUpTap: function (e) {
			let idx = pageHelper.dataset(e, 'idx');
			let fields = this.data.fields;
			dataHelper.arraySwap(fields, idx, idx - 1);
			this.setData({
				fields
			});
			this.setGlow(idx - 1);
			this.triggerEvent('formset', fields);
		},

		bindDownTap: function (e) {
			let idx = pageHelper.dataset(e, 'idx');
			let fields = this.data.fields;
			dataHelper.arraySwap(fields, idx, idx + 1);
			this.setData({
				fields
			});
			this.setGlow(idx + 1);
			this.triggerEvent('formset', fields);
		}
	}
})