$(document).ready(function () {

	// 主要用于后台的赛选功能     list page                    
	var ndCategory = $('#js-category');  //取到表单里面节点
	var ndAuthor = $('#js-author');
	var ndKeyword = $('#js-keyword');  //把关键词传给客户端   为后台搜索功能添加关键字

	$('#js-filter-submit').on('click', function () {  //提交触发时
		var query = queryString.parse(location.search);  //从浏览器地址栏里面解析查询内容
		var category = ndCategory.val();  //获取下拉列表的值
		var author = ndAuthor.val();
		var keyword = ndKeyword.val();  //每次提交取出 keyword

		if (category) {
			query.category = category  //把用户选中的值 置于查询对象中
		} else {
			delete query.category;
		}

		if (author) {
			query.author = author
		} else {
			delete query.author;
		}
		//附加到请求参数中
		if (keyword) {
			query.keyword = keyword
		} else {
			delete query.keyword;
		}

		console.log(queryString.stringify(query));
		//重新对 wondow rul 进行赋值  跳转页面
		window.location.url = window.location.origin + window.location.pathname + queryString.stringify(query);

	});

	// 初始化ckeditor 给它一个id  add page
	if (typeof CKEDITOR !== 'undefined') {
		CKEDITOR.replace('js-post-content');
	}
});
