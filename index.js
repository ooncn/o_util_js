'use strict';
const COOKIES = require("js-cookie");
const MD5 = require("js-md5");
const exif = require("exif-js");
const SparkMD5 = require("spark-md5");

const util = {
    alertErr(_this, err) {
        console.log(err);
        var message = "";
        try {
            if (err.response && err.response.data && err.response.data.msg && err.response.data.msg == "error") {
                var data = err.response.data.data;
                if (typeof (data) == "string") {
                    message = data
                } else {
                    message = JSON.stringify(data)
                }
            } else {
                message = _this.ENUMS.ERROR[err.response.data.msg];
                if (err.response.data.msg == 'SQL_SERVICE_ERROR') {
                    this.sqlServiceErr(_this);
                    return
                } else if (err.response.data.msg == 'NO_AUTHORITY') {
                    COOKIES.remove('is_login');
                    COOKIES.remove('url_index');
                    COOKIES.remove('user_info');
                    COOKIES.remove('user_info_token');
                    localForage.removeItem("user_info");
                    localForage.removeItem("user_token");
                    setTimeout(() => {
                        this.toUrl(_this, "/login")
                    }, 2500);
                }
            }
            _this.$Message.error(message);
        } catch (e) {
            console.log(e)
        }
    },
    sqlServiceErr(_this) {
        var that = this;
        _this.$alert('数据库连接失败!此问题必须解决不然无法进行使用', '警报', {
            confirmButtonText: '确定',
            callback: action => {
                that.sqlServiceErr(_this)
            }
        });
    },
    /**
     * 实现删除数组重复元素
     * 获取没重复的最右一值放入新数组。（检测到有重复值时终止当前循环同时进入顶层循环的下一轮判断）
     * @param array
     * @returns {Array}
     */
    unique(array) {
        var r = [];
        for (var i = 0, l = array.length; i < l; i++) {
            for (var j = i + 1; j < l; j++)
                if (array[i] === array[j]) j = ++i;
            r.push(array[i]);
        }
        return r;
    },
    /**
     *
     * @param arr
     * @param index
     * @param tindex
     */
    arrTo(arr, index, tindex) {
        //如果当前元素在拖动目标位置的下方，先将当前元素从数组拿出，数组长度-1，我们直接给数组拖动目标位置的地方新增一个和当前元素值一样的元素，
        //我们再把数组之前的那个拖动的元素删除掉，所以要len+1
        if (index > tindex) {
            arr.splice(tindex, 0, arr[index]);
            arr.splice(index + 1, 1)
        } else {
            //如果当前元素在拖动目标位置的上方，先将当前元素从数组拿出，数组长度-1，我们直接给数组拖动目标位置+1的地方新增一个和当前元素值一样的元素，
            //这时，数组len不变，我们再把数组之前的那个拖动的元素删除掉，下标还是index
            arr.splice(tindex + 1, 0, arr[index]);
            arr.splice(index, 1)
        }
    },

    /**
     * 上传前对文件检查
     * @param file
     * @returns {boolean}
     */
    isFileOk(file) {
        var isJPG = (file.type === 'image/png' || file.type === 'image/gif' || file.type === 'image/jpeg');
        var isLt2M = file.size / 1024 < 500;
        if (!isJPG) {
            Message.error('上传头像图片只能是 JPG/png/gif 格式!');
        }
        if (!isLt2M) {
            Message.error('上传头像图片大小不能超过 500KB!');
        }
        var img = new Image();
        var isSize;
        var _URL = window.URL || window.webkitURL;
        img.onload = function () {
            if (img.width <= 640 && img.height <= 640) {
                isSize = true;
            } else {
                isSize = false;
            }
        };
        img.src = _URL.createObjectURL(file);
        if (!isSize) {
            Message.error('上传的图片尺寸不能大于 640*640!');
        }
        return isJPG && isLt2M && isSize;
    },
    /**
     *
     * @param that
     * @param str
     */
    loadStr(that, str) {
        if (str) {
            that.loadingText = str;
            that.loading = true;
        } else {
            that.loading = false;
        }
    },
    /**
     *
     * @param that
     */
    editClose(that) {
        try {
            for (let i in that.$refs) {
                that.$refs[i].resetFields();
            }
        } catch (e) {
        }
    },
    toLocal(val) {
        window.location = val;
    },
    /**
     *
     * @param val
     */
    toUrlOpen(val) {
        window.open(val, '_blank');
    },
    /**
     *
     * @param other
     * @param formName
     */
    resetForm(other, formName) {
        other.$refs[formName].resetFields();
    },
    /**
     * 判断属组重复
     * @param array 数组
     * @param key 对象数组的话，对比对象中的key是否重复
     * @returns {{data: Array, repeat: boolean}}
     */
    uniqueArr(array, key) {
        var obj = {
            data: [],
            repeat: false,
        };
        if (array.length <= 0) {
            return obj;
        }
        for (let i of array.reverse()) {
            for (let j of array.reverse()) {
                if (key && (i[key] == j[key])) {
                    obj.repeat = true;
                } else if (i == j) {
                    obj.repeat = true;
                }
            }
        }
        return obj;
    },
    /**
     * 判断当个数组中是否存在指定的值
     * @param array
     * @param key
     * @returns {boolean}
     */
    isUnique(array, key) {
        try {
            if (array.length <= 0) {
                return false;
            }
            var arr = JSON.parse(JSON.stringify(array));
            //var a = [];
            for (let i of arr) {
                var is = 0;
                for (let j of arr) {
                    if (key && (j[key] == i[key])) {
                        is++;
                    } else if (j == i) {
                        is++;
                    }
                }
                if (is > 1) {
                    return true;
                }
            }
        } catch (e) {
            console.log(e)
        }
        return false;
    },
    /**
     * 判断两个数组是否存在重复的值
     * @param array
     * @param array2
     * @param key
     * @returns {boolean}
     */
    isUniqueArr(array, array2, key) {
        try {
            if (array.length <= 0 || array2.length <= 0) {
                return false;
            }
            var arr = [];
            for (let z of array) {
                arr.push(z);
            }
            for (let z of array2) {
                arr.push(z);
            }
            for (let i of arr) {
                var is = 0;
                for (let j of arr) {
                    if (key && (j[key] == i[key])) {
                        is++;
                    } else if (j == i) {
                        is++;
                    }
                }
                if (is > 1) {
                    return true;
                }
            }
        } catch (e) {
            console.log(e)
        }
        return false;
    },
    /**
     * 判断是否数组对象中存在指定的值
     * @param array
     * @param key
     * @param value
     * @returns {boolean}
     */
    isUniqueKeyVal(array, key, value) {
        try {
            if (array.length <= 0) {
                return false;
            }
            var arr = JSON.parse(JSON.stringify(array));
            //var a = [];
            for (let i of arr) {
                if (i[key] == value) {
                    return true;
                }
            }
        } catch (e) {
            console.log(e)
        }
        return false;
    },
    /**
     * 查询 数组中存在的指定值
     * @param array
     * @param key
     * @param value
     * @returns {{data: Array, repeat: boolean}}
     */
    searchObj(array, key, value) {
        var obj = {
            data: [],
            repeat: false,
        };
        try {
            if (array.length <= 0) {
                return obj;
            }
            var arr = JSON.parse(JSON.stringify(array));
            //var a = [];
            for (let i of arr.reverse()) {
                if (i[key] == value) {
                    obj.repeat = true;
                }
            }
        } catch (e) {
            console.log(e)
        }
        return obj;
    },
    /**
     * 数组合并到数组1中
     * @param arr 数组1
     * @param arr2 数组2
     */
    concat(arr, arr2) {
        for (let k of arr2) {
            arr.push(arr2[k]);
        }
    },
    //     一、数组转字符串
//
// 需要将数组元素用某个字符连接成字符串，示例代码如下：
//
//var a, b,c;
// a = new Array(a,b,c,d,e);
// b = a.join('-'); //a-b-c-d-e  使用-拼接数组元素
// c = a.join(''); //abcde
//
//
// 二、字符串转数组
//
// 实现方法为将字符串按某个字符切割成若干个字符串，并以数组形式返回，示例代码如下：
//
//var str = 'ab+c+de';
//var a = str.split('+'); // [ab, c, de]
//var b = str.split(''); //[a, b, +, c, +, d, e]
    strToArr(str) {
        return str.split(",");
    },
    arrToStr(arr) {
        return arr.join(",");
    },
    arrDel(arr, k) {
        arr.splice(arr.indexOf(k), 1);
    },
    arrAdd(arr, k) {
        arr.push(k);
    },
    exeList: ['image/jpeg', 'image/png'],
    UploadFileConfig(file, exe, size, that) {
        var isExe = false;
        if (exe) {
            isExe = exe.indexOf(file.type) > -1;
        }
        var isSize = false;
        if (size) {
            isSize = file.size / 1024 > size;
        }
        if (isExe) {
            that.$message.error('上传文件只能是 ' + exe + ' 格式!');
        }
        if (isSize) {
            that.$message.error('上传文件大小不能超过 ' + size + ' KB!');
        }
        return !isExe && !isSize;
    },


    listChildren(arr, pid = 0) {
        var to = [];
        for (var a of arr) {
            if (a['pid'] && a['pid'] == pid) {
                var c = this.listChildren(arr, a.pid)
                if (c && c.length > 0) {
                    a["children"] = c
                }
                to.push(a);
            }
        }
        return to
    },
    listPid(arr, pid = 0, e = '') {
        var to = [];
        for (var a of arr) {
            var d = {};
            d['id'] = a['id'];
            d['name'] = e + '|---- ' + a['name'];
            if (a['pid'] && a['pid'] == pid) {
                var c = this.listPid(arr, a['id'], '|---- ');
                if (c && c.length > 0) {
                    d["children"] = c;
                }
            }
            // console.log(d)
            to.push(d);
        }
        // console.log(to)
        return to;
    },

    formatDate() {
        var date = new Date();
        var seperator1 = "-";
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var strDate = date.getDate();
        if (month >= 1 && month <= 9) {
            month = "0" + month;
        }
        if (strDate >= 0 && strDate <= 9) {
            strDate = "0" + strDate;
        }
        return year + seperator1 + month + seperator1 + strDate;
    },
    to(t) {
        if (t === 0) {
            return "00:00:00";
        }
        var h = 3600 * 1000;
        var m = 60 * 1000;
        var nh = 0;
        var nm = 0;
        var s = 0;
        if (t >= h) {
            nh = parseInt(t / h);
            nm = parseInt((t % h) / m);
            s = parseInt((t % m) / 1000);
            s = parseInt(((t % h) % m) / 1000);
            return nh + ":" + (nm >= 10 ? nm : "0" + nm) + ":" + (s >= 10 ? s : "0" + s);
        } else if (t < h && t > m) {
            nm = parseInt(t / m);
            s = parseInt((t % m) / 1000);
            return "00:" + (nm >= 10 ? nm : "0" + nm) + ":" + (s >= 10 ? s : "0" + s);
        } else if (t < m && t > 1000) {
            s = parseInt(t / 1000);
            return "00:00:" + (s >= 10 ? s : "0" + s);
        }
        return "毫秒不计算";
    },
    /**************************************时间格式化处理************************************/
    dateFtt(fmt, date) { //author: meizz
        var o = {
            "M+": date.getMonth() + 1,                 //月份
            "d+": date.getDate(),                    //日
            "h+": date.getHours(),                   //小时
            "m+": date.getMinutes(),                 //分
            "s+": date.getSeconds(),                 //秒
            "q+": Math.floor((date.getMonth() + 3) / 3), //季度
            "S": date.getMilliseconds()             //毫秒
        };
        if (/(y+)/.test(fmt))
            fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o)
            if (new RegExp("(" + k + ")").test(fmt))
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return fmt;
    },
    //创建时间格式化显示
    crtTimeFtt(value) {
        var crtTime = new Date(value);
        return this.dateFtt("yyyy-MM-dd hh:mm:ss", crtTime);//直接调用公共JS里面的时间类处理的办法
    },
    /**
     * 获取指定月份的天数
     * @param year 年
     * @param month 月
     * @param is 获取天数
     * @returns {number}
     */
    getDaysInOneMonth(year, month, is) {
        month = parseInt(month, 10);
        var d = new Date(year, month, 0);
        return d.getDate();
    },
    getDayList(date) {
        var year = date.substring(0, 4), month = date.substring(5);
        var c = this.getDaysInOneMonth(year, month);
        // console.log(c);
        var day = [];
        for (let i = 0; i < c; i++) {
            day[i] = (i + 1) + "日";
        }
        return day;
    },
    /**
     *
     * @param that
     * @param val
     */
    toUrl: function (that, val) {
        that.$router.push({path: val});
    },


    /**
     * 判断数组的值是否存在
     * @param _this
     * @param thisArr
     * @param key
     * @returns {boolean}
     */
    isArrKey(_this, thisArr, key) {
        if (thisArr.indexOf(key) === -1 && key) {
            // 不存在则添加
            return true;
        } else {
            Message({
                showClose: true,
                message: key + '已存在',
                type: 'warning'
            });
            return false;
        }
    },

    /**
     * 是否是邮箱
     * @param str 判断字符串
     * @returns {boolean}
     */
    isEmail(str) {
        var reg = new RegExp("^[a-z0-9]+([._\\-]*[a-z0-9])*@([a-z0-9]+[-a-z0-9]*[a-z0-9]+.){1,63}[a-z0-9]+$"); //正则表达式
        return reg.test(str);
    },
    /**
     * 是否是电话号
     * @param str 判断字符串
     * @returns {boolean}
     */
    isPhone(str) {
        var reg = new RegExp(/^1[3|4|5|7|8][0-9]\d{8}$/);
        return reg.test(str)
    },
    /**
     * 判断数字+字符大小写
     * @param str 判断字符串
     * @returns {*|boolean}
     */
    isNumAaZz(str) {
        var reg = new RegExp(/^[A-Za-z0-9]+$/);
        return reg.test(str)
    },

    /**
     * 判断整数
     * @param str 判断字符串 var re = /^[0-9]+.?[0-9]*$/; //判断字符串是否为数字 //判断正整数 /^[1-9]+[0-9]*]*$/
     * @returns {*|boolean}
     */
    isInt(str) {
        var reg = new RegExp(/^[0-9]*$/);
        return reg.test(str)
    },
    /**
     * 判断是否是数字
     * @param str
     * @returns {boolean}
     */
    isNum(str) {
        var reg = new RegExp(/^[0-9]+.?[0-9]*$/);
        return reg.test(str)
    },
    /**
     * 验证是否含有 ^%&',;=?$\" 等字符：[^%&',;=?$\x22]+
     * @param str
     * @returns {*|boolean}
     */
    isFu(str) {
        var reg = new RegExp(/[^%&',;=?$\x22]+/);
        return reg.test(str)
    },

    /**
     * 校验IP地址
     * @param ip
     * @returns {*|boolean}
     */
    isIP(ip) {
        if (ip.length < 7 || ip.length > 15) {
            return false
        }
        var arr = ip.split(".");
        if (arr.length != 4) {
            return false
        }
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] > 255 || arr[i] < 0) {
                return false
            }
        }
        if (arr[3] < 1 || arr[3] > 255) {
            return false
        } else {
            return true
        }
    },
    isMask(ip) {
        if (ip.length < 7 || ip.length > 15) {
            return false
        }
        var arr = ip.split(".");
        if (arr.length != 4) {
            return false
        }
        if (arr[0] != 255) {
            return false
        }
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] != 255 && arr[i] != 0) {
                return false
            }
            if (i <= 2 && arr[i] == 0 && arr[i + 1] != 0) {
                return false
            }
        }
        return true
    },
    isMac(mac) {
        mac = mac.replace(/:/g, "").replace(/ /g, "").replace(/-/g, "");
        // console.log(mac);
        if (mac.length !== 12) {
            return false;
        }
        var reg = new RegExp(/^[0-9a-fA-F]+$/);
        return reg.test(mac)
    },

    /**
     *
     * @param str
     * @returns {boolean}
     */
    isUserName: function (str) {
        var reg = new RegExp("^[A-Za-z0-9_]+$"); //正则表达式
        return reg.test(str);
    },
    /**
     * 判断是否是中文
     * @param str
     * @returns {boolean}
     */
    isChinese: function (str) {
        var re = /^[\u4E00-\u9FA5]+$/;
        // var re = /^[\u4E00-\u9FA5]{1,5}$/;
        return re.test(str);
    },
    // 中文加数字
    isChAa09: function (str) {
        var re = /^[A-Za-z0-9-\u4e00-\u9fa5]+$/;
        return re.test(str);
    },
    isBirthday: function (str) {
        return (jsGetAge(str)) > 17;
    },
    isIdCardNum: function (str) {
        //身份证号码为15位或者18位，15位时全为数字，18位前17位为数字，最后一位是校验位，可能为数字或字符X
        var reg = /(^\d{15}$)|(^\d{16}$)|(^\d{18}$)|(^\d{19}$)|(^\d{20}$)|(^\d{17}(\d|X)$)/;
        return reg.test(str);
    },
    isUrl: function (str) {
        //身份证号码为15位或者18位，15位时全为数字，18位前17位为数字，最后一位是校验位，可能为数字或字符X
        var reg = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\*\+,;=.]+$/;
        return reg.test(str);
    },

    /**
     *
     * @param rule
     * @param value
     * @param callback
     */
    validPhoneNotNull: function (rule, value, callback) {
        if (!value) {
            callback(new Error('请输入电话号码'))
        } else if (!util.isPhone(value)) {
            callback(new Error('请输入正确的11位手机号码'))
        } else {
            callback()
        }
    },
    validPhone: function (rule, value, callback) {
        if (!util.isPhone(value)) {
            callback(new Error('请输入正确的11位手机号码'))
        } else {
            callback()
        }
    },
    /**
     *
     * @param rule
     * @param value
     * @param callback
     */
    validNumAaZz: function (rule, value, callback) {
        if (!util.isNumAaZz(value)) {
            callback(new Error('只能输入数字和大小写英文字母'))
        } else if (value.length < 3 || value.length > 10) {
            callback(new Error('长度3 ~ 10个字符'))
        } else {
            callback()
        }
    },
    /**
     *
     * @param rule
     * @param value
     * @param callback
     */
    validEmail: function (rule, value, callback) {
        if (!value) {
            callback(new Error('请输入邮箱'))
        } else if (!util.isEmail(value)) {
            callback(new Error('请输入正确的邮箱'))
        } else {
            callback()
        }
    },
    /**
     *
     * @param rule
     * @param value
     * @param callback
     */
    validateCode: function (rule, value, callback) {
        var md5 = MD5.hex(value);
        var phone_code = COOKIES.get('phone_code');
        if (phone_code !== md5) {
            callback(new Error('验证码错误'));
        } else {
            callback();
        }
    },
    /**
     *
     * @param rule
     * @param value
     * @param callback
     */
    validIdCardNum: function (rule, value, callback) {
        if (!value) {
            callback(new Error('请输入合法身份证号'))
        } else if (!util.isIdCardNum(value)) {
            callback(new Error('请输入合法身份证号'))
        } else {
            callback()
        }
    },
    /**
     *
     * @param rule
     * @param value
     * @param callback
     */
    validUserName: function (rule, value, callback) {
        if (!value) {
            callback(new Error('请输入账号'))
        } else if (!util.isUserName(value)) {
            callback(new Error('请输入正确格式账号'))
        } else {
            callback()
        }
    },
    /**
     *
     * @param rule
     * @param value
     * @param callback
     */
    validBirthday: function (rule, value, callback) {
        if (!value) {
            callback(new Error('请输入出生日期'))
        } else if (!util.isBirthday(value)) {
            callback(new Error('未满18周岁'))
        } else {
            callback()
        }
    },
    /**
     *
     * @param rule
     * @param value
     * @param callback
     */
    validChinese: function (rule, value, callback) {
        if (!value) {
            callback()
        } else if (!util.isChinese(value)) {
            callback(new Error('请输入中文'))
        } else {
            callback()
        }
    },
    /**
     *
     * @param rule
     * @param value
     * @param callback
     */
    validChAa09: function (rule, value, callback) {
        if (!value) {
            callback()
        } else if (!util.isChAa09(value)) {
            callback(new Error('只允许中文数字字母'))
        } else {
            callback()
        }
    },
    /**
     * 校验数组可以为空
     * @param rule
     * @param value
     * @param callback
     */
    validNullArray: function (rule, value, callback) {
        if (!value) {
            callback()
        } else if (!(value instanceof Array)) {
            callback(new Error('请输入数组'))
        } else {
            callback()
        }
    },
    /**
     * 校验数组
     * @param rule
     * @param value
     * @param callback
     */
    validArray: function (rule, value, callback) {
        if (!value) {
            callback(new Error('不能为空'))
        } else if (!(value instanceof Array)) {
            callback(new Error('请输入数组'))
        } else {
            callback()
        }
    },
    /**
     * 校验数字
     * @param rule
     * @param value
     * @param callback
     */
    validNum: function (rule, value, callback) {
        if (!value) {
            callback()
        } else if (!util.isNum(value)) {
            callback(new Error('请输入数字'))
        } else {
            callback()
        }
    },
    /**
     * 校验IP地址
     * @param rule
     * @param value
     * @param callback
     */
    validIp: function (rule, value, callback) {
        if (!value) {
            callback()
        } else if (!util.isIP(value)) {
            callback(new Error('请输入正确IP地址'))
        } else {
            callback()
        }
    },
    /**
     * 校验子网掩码
     * @param rule
     * @param value
     * @param callback
     */
    validMask: function (rule, value, callback) {
        if (!value) {
            callback(new Error('请输入正确子网掩码'))
        } else if (!util.isMask(value)) {
            callback(new Error('请输入正确子网掩码'))
        } else {
            callback()
        }
    },
    /**
     * 校验MAC地址
     * @param rule
     * @param value
     * @param callback
     */
    validMac: function (rule, value, callback) {
        if (!value) {
            callback(new Error('请输入正确MAC地址'))
        } else if (!util.isMac(value)) {
            callback(new Error('请输入正确MAC地址'))
        } else {
            callback()
        }
    },


    // 文件和图片处理
    imgUtil(file) {
        var _this = this;
        return new Promise((resolve, reject) => {
            _this.getOrientation(file).then((re) => {
                //转换成base64
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = function () {
                    var base64 = this.result,
                        uploadBase64 = new Image();

                    uploadBase64.src = base64;
                    uploadBase64.onload = function () {
                        //修正旋转图片
                        var canvas = document.createElement("canvas");
                        if (re !== undefined && re !== "" && re !== 1) {
                            switch (re) {
                                case 6:
                                    // console.log("顺时针旋转270度");
                                    _this.rotateImg(this, "left", canvas);
                                    break;
                                case 8:
                                    // console.log("顺时针旋转90度");
                                    _this.rotateImg(this, "right", canvas);
                                    break;
                                case 3:
                                    // console.log("顺时针旋转180度");
                                    _this.rotateImg(this, "horizen", canvas);
                                    break;
                            }
                            base64 = canvas.toDataURL(file.type);
                            _this.imgZip(file, base64, canvas.width, canvas.height).then((res) => {
                                base64 = res
                            });
                            resolve({src: base64/*, md5: spark.end()*/});
                        } else {
                            _this.imgZip(file, base64, canvas.width, canvas.height).then((res) => {
                                base64 = res
                            });
                            resolve({src: base64/*, md5: spark.end()*/});
                        }
                        //输出转换后的流
                        // var newBlob = convertBase64UrlToBlob(base64, file.type);
                        // spark.appendBinary(newBlob);
                        //console.log(spark.end());
                    };
                };
            }).catch((err) => {
                reject(err)
            })
        })
    },

    //判断图片是否需要选择
    getOrientation(file) {
        return new Promise((resolve, reject) => {
            exif.getData(file, function () {
                resolve(exif.getTag(this, "Orientation"))
            });
        })
    },

    //对图片旋转处理
    rotateImg(img, direction, canvas) {
        //console.log("开始旋转图片");
        //图片旋转4次后回到原方向
        if (img == null) return;
        var height = img.height;
        var width = img.width;
        var step = 2;

        if (direction == "right") {
            step++;
        } else if (direction == "left") {
            step--;
        } else if (direction == "horizen") {
            step = 2; //不处理
        }
        //旋转角度以弧度值为参数
        var degree = step * 90 * Math.PI / 180;
        var ctx = canvas.getContext("2d");
        switch (step) {
            case 0:
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0);
                break;
            case 1:
                canvas.width = height;
                canvas.height = width;
                ctx.rotate(degree);
                ctx.drawImage(img, 0, -height);
                break;
            case 2:
                canvas.width = width;
                canvas.height = height;
                ctx.rotate(degree);
                ctx.drawImage(img, -width, -height);
                break;
            case 3:
                canvas.width = height;
                canvas.height = width;
                ctx.rotate(degree);
                ctx.drawImage(img, -width, 0);
                break;
        }
        //console.log("结束旋转图片");
    },

    getBase64File(file) {
        var reader = new FileReader();
        reader.readAsDataURL(file);
        return new Promise((resolve) => {
            reader.onload = function () {
                resolve(this.result)
            }
        })
    },

    convertBase64UrlToBlob(urlData, type) {
        var bytes = window.atob(urlData.split(',')[1]);        //去掉url的头，并转换为byte
        //处理异常,将ascii码小于0的转换为大于0
        var ab = new ArrayBuffer(bytes.length);
        var ia = new Uint8Array(ab);
        for (var i = 0; i < bytes.length; i++) {
            ia[i] = bytes.charCodeAt(i);
        }
        return new Blob([ab], {type: type});
    },
    calculate: function () {
        var fileReader = new FileReader(),
            blobSlice = File.prototype.mozSlice || File.prototype.webkitSlice || File.prototype.slice,
            file = document.getElementById("file").files[0],
            chunkSize = 2097152,
            // read in chunks of 2MB
            chunks = Math.ceil(file.size / chunkSize),
            currentChunk = 0,
            spark = new SparkMD5();

        fileReader.onload = function (e) {
            //console.log("read chunk nr", currentChunk + 1, "of", chunks);
            spark.appendBinary(e.target.result); // append binary string
            currentChunk++;

            if (currentChunk < chunks) {
                loadNext();
            } else {
                //console.log("finished loading");
                console.info("computed hash", spark.end()); // compute hash
            }
        };

        function loadNext() {
            var start = currentChunk * chunkSize,
                end = start + chunkSize >= file.size ? file.size : start + chunkSize;
            fileReader.readAsBinaryString(blobSlice.call(file, start, end));
        }

        loadNext();
    },
    imgZip: function (file, base64, w, h) {
        return new Promise((resolve, reject) => {
            if (w < 1001 && h < 1001) {
                return base64
            }
            var scale = w / h;
            var canvas = document.createElement("canvas");
            var ctx = canvas.getContext("2d");
            // 默认按比例压缩
            if (w > 1000 || w > h) {
                w = 1000;
                h = parseInt(w / scale)
            } else if (h > 1000 || h > w) {
                h = 1000;
                w = parseInt(h * scale)
            }
            var quality = 0.7;  // 默认图片质量为0.7
            // 创建属性节点
            canvas.width = w;
            canvas.height = h;
            var newImg = new Image();
            newImg.src = base64;
            newImg.onload = function () {
                ctx.drawImage(newImg, 0, 0, w, h);
                //输出转换后的base64图片
                resolve(canvas.toDataURL(file.type, quality));
            }
        });
    }
};
module.exports = util;
// Allow use of default import syntax in TypeScript
module.exports.default = util;