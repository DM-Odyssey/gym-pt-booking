const pageHelper = require('../../../../utils/index.js');
const helper = require('../../../../utils/helper.js');
const cloudHelper = require('../../../../utils/cloud.js');
const cacheHelper = require('../../../../utils/cache.js');
const formSetHelper = require('../form_set_helper.js');
const validate = require('../../../../utils/validate.js');
const setting = require('../../../../config/setting.js');

const CACHE_FORM_SHOW_KEY = 'FORM_SHOW_CMPT';
const CACHE_FORM_SHOW_TIME = 86400 * 365;

Component({
	options: {
		addGlobalClass: true
	},

	properties: {
		mark: { type: String, value: '' },
		source: { type: String, value: 'user' },
		fields: {
			type: Array, value: [],
			observer: function(newVal) {
				if (this._initializing) return;
				if (newVal && newVal.length > 0) this._init();
			},
		},
		forms: { type: Array, value: [] },
		doShow: { type: Boolean, value: false },
		isConfirm: { type: Boolean, value: true },
		isCacheMatch: { type: Boolean, value: true },
		isDefMatch: { type: Boolean, value: true },
	},

	data: {
		cacheName: '',
		isLoad: false,
		showCheckModal: false,
		mobileCheck: setting.MOBILE_CHECK
	},

	lifetimes: {
		attached: function () {},
		ready: function () {
			if (this.data.isCacheMatch) {
				let cacheName = CACHE_FORM_SHOW_KEY + '_' + this.data.mark;
				this.setData({ cacheName });
			}
			this._init();
		},
		detached: function () {},
	},

	methods: {
		reload: function () {
			this._init();
		},
		_init: function () {
			if (this._initializing) return;
			this._initializing = true;
			let fields = formSetHelper.initFields(this.data.fields);
			let newForms = [];

			for (let k = 0; k < fields.length; k++) {
				let node = {};
				node.mark = fields[k].mark;
				node.title = fields[k].title;
				node.type = fields[k].type;
				let val = this._getOneValForm(fields[k].mark, fields[k].title, fields[k].type);
				if (val === null) val = '';
				val = this._fixType(fields[k].type, val);
				node.val = val;
				fields[k].val = val;
				newForms.push(node);
			}

			this.setData({ forms: newForms, fields, isLoad: true });
			this._initializing = false;
		},

		_getOneValForm: function (mark, title, type) {
			if (type == 'line') return title;
			let ret = null;
			let forms = this.data.forms;
			if (!forms || !Array.isArray(forms)) forms = [];
			for (let k = 0; k < forms.length; k++) {
				if (forms[k].mark == mark && forms[k].type == type) { ret = forms[k].val; break; }
				if (forms[k].title == title && forms[k].type == type) { ret = forms[k].val; break; }
				if (type == 'mobile' && forms[k].type == 'mobile') { ret = forms[k].val; break; }
				if (type == 'idcard' && forms[k].type == 'idcard') { ret = forms[k].val; break; }
			}
			if (ret === undefined) ret = null;
			if (ret === null && this.data.isCacheMatch && (type != 'image' && type != 'content')) {
				let caches = cacheHelper.get(this.data.cacheName);
				if (caches && Array.isArray(caches)) {
					for (let k = 0; k < caches.length; k++) {
						if (caches[k].mark == mark && caches[k].type == type) { ret = caches[k].val; break; }
						if (caches[k].title == title && caches[k].type == type) { ret = caches[k].val; break; }
						if (type == 'mobile' && caches[k].type == 'mobile') { ret = caches[k].val; break; }
						if (type == 'idcard' && caches[k].type == 'idcard') { ret = caches[k].val; break; }
					}
				}
			}
			if (ret === undefined) ret = null;
			if (ret === null && this.data.isDefMatch) {
				let fields = this.data.fields;
				for (let k = 0; k < fields.length; k++) {
					if (fields[k].mark == mark && helper.isDefined(fields[k].def) && fields[k].def != null) {
						ret = fields[k].def;
						break;
					}
				}
			}
			return ret;
		},

		_fixType: function (type, val) {
			if (type == 'line') return val;
			if (type != 'switch' && type != 'checkbox' && type != 'area' && type != 'content' && type != 'image') {
				if (typeof val === 'object' && !Array.isArray(val)) val = '';
				else if (val === undefined) val = '';
				else val = String(val).trim();
			}
			switch (type) {
				case 'image': if (!Array.isArray(val)) return []; break;
				case 'content': if (typeof val === 'string') return val ? [{ type: 'text', val: val.trim() }] : []; if (!Array.isArray(val)) return []; break;
				case 'area': if (!Array.isArray(val) || val.length != 3) return ''; break;
				case 'switch': if (typeof (val) != 'boolean') return true; break;
				case 'checkbox': if (!Array.isArray(val)) return [String(val).trim()]; break;
				case 'year': if (!val || validate.checkYear(val)) return ''; break;
				case 'month': if (!val || validate.checkYearMonth(val)) return ''; break;
				case 'date': if (!val || validate.checkDate(val)) return ''; break;
				case 'hourminute': if (!val || validate.checkHourMinute(val)) return ''; break;
				case 'int': if (!val || validate.checkInt(val)) return ''; break;
				case 'digit': if (!val || validate.checkDigit(val)) return ''; break;
				default: break;
			}
			return val;
		},

		_setForm: function (idx, val) {
			let forms = this.data.forms;
			let fields = this.data.fields;
			fields[idx].val = val;
			forms[idx].val = val;
			for (let k = 0; k < fields.length; k++) { if (helper.isDefined(fields[k].focus)) delete fields[k].focus; }
			let formsName = 'forms[' + idx + '].val';
			let fieldsName = 'fields[' + idx + '].val';
			this.setData({ [formsName]: val, [fieldsName]: val });
		},

		bindImgUploadCmpt: function (e) { let idx = pageHelper.dataset(e, 'idx'); this._setForm(idx, e.detail); },
		bindLineBlur: function (e) { let idx = pageHelper.dataset(e, 'idx'); this._setForm(idx, e.detail.value.trim()); },
		bindMultiBlur: function (e) { let idx = pageHelper.dataset(e, 'idx'); this._setForm(idx, e.detail.value); },
		bindDayChange: function (e) { let idx = pageHelper.dataset(e, 'idx'); this._setForm(idx, e.detail.value.trim()); },
		bindAreaChange: function (e) { let idx = pageHelper.dataset(e, 'idx'); this._setForm(idx, e.detail.value); },
		bindSelectCmpt: function (e) { let idx = pageHelper.dataset(e, 'idx'); this._setForm(idx, e.detail.trim()); },
		bindCheckBoxCmpt: function (e) { let idx = pageHelper.dataset(e, 'idx'); this._setForm(idx, e.detail); },
		bindRadioCmpt: function (e) { let idx = pageHelper.dataset(e, 'idx'); this._setForm(idx, e.detail); },
		switchModel: function (e) { let idx = pageHelper.dataset(e, 'idx'); this._setForm(idx, e.detail.value); },

		bindGetPhoneNumber: async function (e) {
			if (e.detail.errMsg == "getPhoneNumber:ok") {
				let cloudID = e.detail.cloudID;
				let params = { cloudID };
				let opt = { title: '手机验证中' };
				await cloudHelper.callCloudSubmit('passport/phone', params, opt).then(res => {
					let phone = res.data;
					if (!phone || phone.length < 11) wx.showToast({ title: '手机号码获取失败，请重新绑定手机号码', icon: 'none', duration: 2000 });
					else { let idx = pageHelper.dataset(e, 'idx'); this._setForm(idx, phone); }
				});
			} else wx.showToast({ title: '手机号码获取失败，请重新绑定手机号码', icon: 'none' });
		},

		checkForms: function () {
			if (this.data.isCacheMatch) cacheHelper.set(this.data.cacheName, this.data.forms, CACHE_FORM_SHOW_TIME);
			let ret = formSetHelper.checkForm(this.data.fields, this.data.forms, this);
			var that = this;
			wx.nextTick(function() { that.setData({ fields: that.data.fields }); });
			if (!ret) return;
			if (this.data.isConfirm) {
				wx.nextTick(function() { that.setData({ showCheckModal: true }); });
			} else {
				cacheHelper.remove(this.data.cacheName);
				this.triggerEvent('submit', this.data.forms);
			}
		},

		bindSubmitCmpt: function () {
			this.setData({ showCheckModal: false });
			cacheHelper.remove(this.data.cacheName);
			this.triggerEvent('submit', this.data.forms);
		},

		url: function (e) { pageHelper.url(e, this); },

		getForms: function (isCheckForm) {
			if (isCheckForm === undefined) isCheckForm = false;
			if (isCheckForm) {
				let ret = formSetHelper.checkForm(this.data.fields, this.data.forms, this);
				var that = this;
				wx.nextTick(function() { that.setData({ fields: that.data.fields }); });
				if (!ret) return false;
			}
			if (this.data.isCacheMatch) cacheHelper.set(this.data.cacheName, this.data.forms, CACHE_FORM_SHOW_TIME);
			return this.data.forms;
		},

		getOneFormVal(formName) {
			let forms = this.data.forms;
			for (let k = 0; k < forms.length; k++) { if (formName == forms[k].mark) return forms[k].val; }
			return null;
		},

		setOneFormVal(formName, val) {
			let forms = this.data.forms, fields = this.data.fields;
			for (let k = 0; k < forms.length; k++) {
				if (formName == forms[k].mark) { forms[k].val = val; fields[k].val = val; break; }
			}
			this.setData({ fields, forms });
		}
	},
})