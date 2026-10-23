var tl = new TimelineMax();
$('.tabs-block li').on('click', function(){
	var $label = $('.label');	
	var $this = $(this);
	var el_width = $this.width();
	var offset_left = $this.offset();
	var initTabNum = $this.data('menu');
	var $article= $('.article');
	var $show = $('.show');	
	function step_1() {
		$article.removeClass('show')
	}
	function step_2() {
		$('.num_' + initTabNum).addClass('show')
	}	
		
	if(!tl.isActive()){
		tl.to($article, 0.5, {y: 100, ease: Back.easeOut, onComplete: step_1})
		.fromTo($('.num_' + initTabNum), 0.75, { onStart: step_2, y: -100}, {y: 0, ease: Elastic.easeOut, immediateRender:false})
		//.to($article, 0, {y: 0, ease: Sine.easeOut})	
		$label.offset({		
			left : offset_left.left
		}).css('width', el_width)
		$('.tabs-block li').removeClass('active');
	$this.addClass('active');
  }	
})

var initSize = function() {
	var start_element = $('.tabs-block li:first-of-type');
	var $label = $('.label');
	var initWidth = start_element.css('width')	
	$label.css('width', initWidth)	
}
initSize()
