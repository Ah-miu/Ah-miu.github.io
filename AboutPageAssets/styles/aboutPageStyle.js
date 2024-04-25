document.addEventListener('DOMContentLoaded', (event) => {
  // 交互显示功能
  document.querySelectorAll('.newPaper').forEach(newPaper => {
    newPaper.addEventListener('mouseenter', () => {
      newPaper.querySelector('.staticImage').style.display = 'none';
      newPaper.querySelector('.animatedGif').style.display = 'block';
    });
    newPaper.addEventListener('mouseleave', () => {
      newPaper.querySelector('.staticImage').style.display = 'block';
      newPaper.querySelector('.animatedGif').style.display = 'none';
    });
  });

	document.querySelectorAll('.cite-btn').forEach(button => {
	  button.addEventListener('click', function(event) {
		event.preventDefault(); // 阻止链接默认行为
		const citationText = this.getAttribute('data-citation').replace(/<br>/g, '\n'); // 将 <br> 替换为换行符
		navigator.clipboard.writeText(citationText).then(() => {
		  // 显示复制成功消息
		  const confirmation = document.getElementById('copy-confirmation');
		  confirmation.style.display = 'block';
		  setTimeout(() => { confirmation.style.display = 'none'; }, 2000); // 2秒后隐藏消息
		}).catch(err => {
		  console.error('Error copying text: ', err);
		});
	  });
	});

	


  // 悬浮窗显示功能
  const wechatButton = document.querySelector(".list a[href='#wetchat']");
  const wechatModal = document.getElementById("wechat-modal");
  const closeBtn = wechatModal.querySelector(".close");

  wechatButton.addEventListener('click', () => {
    wechatModal.style.display = "block";
  });

  closeBtn.addEventListener('click', () => {
    wechatModal.style.display = "none";
  });

  window.addEventListener('click', e => {
    if (e.target === wechatModal) {
      wechatModal.style.display = "none";
    }
  });
	
	// gallery
	const track = document.getElementById("image-track");

	const handleOnDown = e => track.dataset.mouseDownAt = e.clientX;

	const handleOnUp = () => {
	  track.dataset.mouseDownAt = "0";  
	  track.dataset.prevPercentage = track.dataset.percentage;
	}

	const handleOnMove = e => {
	  if(track.dataset.mouseDownAt === "0") return;

	  const mouseDelta = parseFloat(track.dataset.mouseDownAt) - e.clientX,
			maxDelta = window.innerWidth / 2;

	  const percentage = (mouseDelta / maxDelta) * -100,
			nextPercentageUnconstrained = parseFloat(track.dataset.prevPercentage) + percentage,
			nextPercentage = Math.max(Math.min(nextPercentageUnconstrained, 0), -100);

	  track.dataset.percentage = nextPercentage;

	  track.animate({
		transform: `translate(${nextPercentage}%, -50%)`
	  }, { duration: 1200, fill: "forwards" });

	  for(const image of track.getElementsByClassName("image")) {
		image.animate({
		  objectPosition: `${100 + nextPercentage}% center`
		}, { duration: 1200, fill: "forwards" });
	  }
	}

	/* -- Had to add extra lines for touch events -- */

	window.onmousedown = e => handleOnDown(e);

	window.ontouchstart = e => handleOnDown(e.touches[0]);

	window.onmouseup = e => handleOnUp(e);

	window.ontouchend = e => handleOnUp(e.touches[0]);

	window.onmousemove = e => handleOnMove(e);

	window.ontouchmove = e => handleOnMove(e.touches[0]);
	
	// for email
	document.getElementById('emailLink').addEventListener('click', function(event) {
	  event.preventDefault();
	  const email = 'hi.jinghan@gmail.com';

	  navigator.clipboard.writeText(email)
		.then(() => {
		  console.log('Email copied to clipboard');
		  const copiedSpan = document.getElementById('copied');
		  copiedSpan.style.display = 'inline';
		  setTimeout(() => {
			copiedSpan.style.display = 'none';
		  }, 2000);
		})
		.catch((error) => {
		  console.error('Failed to copy email: ', error);
		});
	});
	
	
});


