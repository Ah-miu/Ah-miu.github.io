/*------------- show ---------------*/
// 使用querySelectorAll选择所有.newPaper元素，并遍历它们
document.querySelectorAll('.newPaper').forEach(function(newPaper) {
  // 为每个.newPaper添加mouseenter事件监听器
  newPaper.addEventListener('mouseenter', function() {
    this.querySelector('.staticImage').style.display = 'none';
    this.querySelector('.animatedGif').style.display = 'block';
  });

  // 为每个.newPaper添加mouseleave事件监听器
  newPaper.addEventListener('mouseleave', function() {
    this.querySelector('.staticImage').style.display = 'block';
    this.querySelector('.animatedGif').style.display = 'none';
  });
});

/*------------- cite ---------------*/
//document.addEventListener('DOMContentLoaded', (event) => {
//  const citeButtons = document.querySelectorAll('.cite-btn');
//  const citationModal = document.getElementById('citation-modal');
//  const citationContent = document.getElementById('citation-content');
//  const copyCitationBtn = document.getElementById('copy-citation');
//
//  // 给每个引用按钮添加点击事件
//  citeButtons.forEach(button => {
//    button.addEventListener('click', function() {
//      const citation = this.getAttribute('data-citation');
//      citationContent.textContent = citation.replace(/,\s/g, ",\n"); // 替换逗号后面的空格为换行，格式化显示
//      citationModal.style.display = 'block'; // 显示引用弹窗
//    });
//  });
//
//  // 复制引用内容到剪切板
//  copyCitationBtn.addEventListener('click', function() {
//    navigator.clipboard.writeText(citationContent.textContent).then(() => {
//      // 提示复制成功或关闭弹窗
//      console.log('Citation copied to clipboard');
//    });
//  });
//
//  // 点击弹窗外任何地方关闭弹窗
//  window.addEventListener('click', function(e) {
//    if (!citationModal.contains(e.target) && !e.target.classList.contains('cite-btn')) {
//      citationModal.style.display = 'none';
//    }
//  });
//});
document.addEventListener('DOMContentLoaded', (event) => {
  const citeButtons = document.querySelectorAll('.cite-btn');
  const citationModal = document.getElementById('citation-modal');
  const citationContent = document.getElementById('citation-content');
  const copyCitationBtn = document.getElementById('copy-citation');

  // 给每个引用按钮添加点击事件
  citeButtons.forEach(button => {
    button.addEventListener('click', function() {
      const citationRaw = this.getAttribute('data-citation');
      citationContent.innerHTML = citationRaw; // 直接设置 innerHTML，<br> 用于换行
      citationModal.style.display = 'block'; // 显示引用弹窗
    });
  });

  // 复制引用内容到剪切板
  copyCitationBtn.addEventListener('click', function() {
    // 创建一个虚拟元素以转换 HTML 为文本
    let dummyDiv = document.createElement("div");
    dummyDiv.innerHTML = citationContent.innerHTML;
    const textToCopy = dummyDiv.textContent || dummyDiv.innerText;
    navigator.clipboard.writeText(textToCopy).then(() => {
      console.log('Citation copied to clipboard');
      citationModal.style.display = 'none'; // 关闭弹窗
    }).catch(err => {
      console.error('Error copying text: ', err);
    });
  });

  // 点击弹窗外任何地方关闭弹窗
  window.addEventListener('click', function(e) {
    if (!citationModal.contains(e.target) && e.target.className.indexOf('cite-btn') === -1) {
      citationModal.style.display = 'none';
    }
  });
});




