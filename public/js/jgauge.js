/*!
 * jGauge v0.3.0 Alpha 3
 * http://www.jgauge.com/
 * Date: 03 March 2011
 *
 * Copyright 2010-2011, Darian Cabot
 * Licensed under the MIT license
 * http://www.jgauge.com/#licence
 */

var limitAction={spin:0,clamp:1,autoRange:2};var autoPrefix={none:0,si:1,binary:2};function jGauge()
{var jG=this;jG.version='0.3.0.3';jG.centerX=0;jG.centerY=0;jG.id='';jG.segmentStart=-200;jG.segmentEnd=20;jG.imagePath='img/jgauge_face_default.png';jG.width=160;jG.height=114;jG.showAlerts=false;jG.autoPrefix=autoPrefix.si;jG.siPrefixes=['','k','M','G','T','P','E','Z','Y'];jG.binaryPrefixes=jG.siPrefixes;function needle()
{var ndl=this;ndl.imagePath='img/jgauge_needle_default.png';ndl.limitAction=limitAction.autoRange;ndl.xOffset=0;ndl.yOffset=24;}
jG.needle=new needle();function label()
{var lbl=this;lbl.color='#144b66';lbl.precision=1;lbl.prefix='';lbl.suffix='';lbl.xOffset=0;lbl.yOffset=20;}
jG.label=new label();function ticks()
{var tks=this;tks.count=11;tks.start=0;tks.end=10;tks.color='rgba(255, 255, 255, 1)';tks.thickness=3;tks.radius=76;tks.labelPrecision=1;tks.labelRadius=63;tks.labelColor='#327a9e';}
jG.ticks=new ticks();function range()
{var rng=this;rng.radius=55;rng.thickness=36;rng.start=-24;rng.end=25;rng.color='rgba(255, 32, 0, 0.2)';}
jG.range=new range();jG.value=0;jG.init=init;jG.setValue=setValue;jG.getValue=getValue;jG.updateTicks=updateTicks;jG.updateRange=updateRange;jG.resetLayers=resetLayers;jG.prefixNumber=prefixNumber;function init()
{var labelCssLeft;var labelCssTop;var needleCssLeft;var neeldeCssTop;jG.centerX=jG.width/2;jG.centerY=jG.height/2;$('#'+jG.id).css({'width':jG.width,'height':jG.height});$('#'+jG.id).children().remove();$('#'+jG.id).css('background-image','url("'+jG.imagePath+'")');jG.updateRange();jG.updateTicks();htmlString='<p id="'+jG.id+'-label" class="label">'+
jG.label.prefix+'<strong>'+jG.ticks.start+'</strong>'+jG.label.suffix+'</p>';$('#'+jG.id).append(htmlString);labelCssLeft=Math.round(jG.centerX-$('#'+jG.id+'-label').getHiddenDimensions().w/2+jG.label.xOffset)+'px';labelCssTop=Math.round(jG.centerY-$('#'+jG.id+'-label').getHiddenDimensions().h/2+jG.label.yOffset)+'px';$('#'+jG.id+'-label').css({'left':labelCssLeft,'top':labelCssTop});$('#'+jG.id+' .label').css('color',jG.label.color);$('#'+jG.id+'-label').fadeIn('slow');htmlString='<img id="'+jG.id+'-needle" class="needle" src="'+jG.needle.imagePath+'" />';$('#'+jG.id).append(htmlString);$('#'+jG.id+'-needle').load(function(){needleCssLeft=Math.round(jG.centerX-($('#'+jG.id+'-needle').getHiddenDimensions().w/2)+jG.needle.xOffset)+'px';neeldeCssTop=Math.round(jG.centerY-($('#'+jG.id+'-needle').getHiddenDimensions().h/2)+jG.needle.yOffset)+'px';$('#'+jG.id+'-needle').css({'left':needleCssLeft,'top':neeldeCssTop});});$('#'+jG.id+'-needle').fadeIn('slow');jG.resetLayers();jG.setValue(jG.ticks.start);jG.setValue(jG.ticks.start);}
function resetLayers()
{$('#'+jG.id).css('z-index',0);$('#'+jG.id+'-canvas-ranges').css('z-index',1);$('#'+jG.id+'-canvas-ticks').css('z-index',2);$('#'+jG.id+' .tick-label').css('z-index',3);$('#'+jG.id+'-label').css('z-index',4);$('#'+jG.id+'-needle').css('z-index',5);}
function updateRange()
{var canvas;var ctx;$('#'+jG.id+'-canvas-ranges').remove();htmlString='<canvas id="'+jG.id+'-canvas-ranges"></canvas>';$('#'+jG.id).append(htmlString);canvas=document.getElementById(jG.id+'-canvas-ranges');canvas.width=jG.width;canvas.height=jG.height;if(canvas.getContext)
{ctx=canvas.getContext('2d');ctx.strokeStyle=jG.range.color;ctx.lineWidth=jG.range.thickness;ctx.beginPath();ctx.arc(jG.centerX+jG.needle.xOffset,jG.centerY+jG.needle.yOffset,jG.range.radius,(Math.PI/180)*jG.range.start,(Math.PI/180)*jG.range.end,false);ctx.stroke();jG.resetLayers();}
else
{if(jG.showAlerts===true)
{alert('Sorry, canvas is not supported by your browser!');}}}
function updateTicks()
{var gaugeSegmentStep;var htmlString;var canvas;var ctx;var startAngle;var endAngle;var tickStep;var leftOffset;var topOffset;var tickLabelCssLeft;var tickLabelCssTop;$('#'+jG.id+'-canvas-ticks').remove();if(jG.ticks.count!==0||jG.ticks.thickness!==0)
{htmlString='<canvas id="'+jG.id+'-canvas-ticks"></canvas>';$('#'+jG.id).append(htmlString);canvas=document.getElementById(jG.id+'-canvas-ticks');canvas.width=jG.width;canvas.height=jG.height;if(canvas.getContext)
{ctx=canvas.getContext('2d');gaugeSegmentStep=Math.abs(jG.segmentStart-jG.segmentEnd)/(jG.ticks.count-1);ctx.strokeStyle=jG.ticks.color;ctx.lineWidth=5;for(i=0;i<=jG.ticks.count-1;i++)
{startAngle=(Math.PI/180)*(jG.segmentStart+(gaugeSegmentStep*i)-(jG.ticks.thickness/2));endAngle=(Math.PI/180)*(jG.segmentStart+(gaugeSegmentStep*i)+(jG.ticks.thickness/2));ctx.beginPath();ctx.arc(jG.centerX+jG.needle.xOffset,jG.centerY+jG.needle.yOffset,jG.ticks.radius,startAngle,endAngle,false);ctx.stroke();}
jG.resetLayers();}
else
{if(jG.showAlerts===true)
{alert('Sorry, canvas is not supported by your browser!');}}}
$('#'+jG.id+' .tick-label').remove();if(jG.tickCount!==0)
{tickStep=(jG.ticks.end-jG.ticks.start)/(jG.ticks.count-1);gaugeSegmentStep=Math.abs(jG.segmentStart-jG.segmentEnd)/(jG.ticks.count-1);for(i=0;i<=jG.ticks.count-1;i++)
{htmlString='<p class="tick-label">'+prefixNumber(jG.ticks.start+i*tickStep,false)+'</p>';$('#'+jG.id).append(htmlString);leftOffset=jG.centerX+jG.needle.xOffset-$('#'+jG.id+' .tick-label').getHiddenDimensions().w/2;topOffset=jG.centerY+jG.needle.yOffset-$('#'+jG.id+' .tick-label').getHiddenDimensions().h/2;tickLabelCssLeft=Math.round((jG.ticks.labelRadius*Math.cos((jG.segmentStart+(i*gaugeSegmentStep))*Math.PI/180))+leftOffset)+'px';tickLabelCssTop=Math.round(jG.ticks.labelRadius*Math.sin(Math.PI/180*(jG.segmentStart+(i*gaugeSegmentStep)))+topOffset)+'px';$('#'+jG.id+' p:last').css({'left':tickLabelCssLeft,'top':tickLabelCssTop});}
$('#'+jG.id+' .tick-label').css('color',jG.ticks.labelColor);$('#'+jG.id+' .tick-label').fadeIn('slow');}}
function setValue(newValue)
{var degreesMult;var valueDegrees;var htmlString;var needleCssLeft;var needleCssTop;jG.value=newValue;degreesMult=(jG.segmentEnd-jG.segmentStart)/(jG.ticks.end-jG.ticks.start);valueDegrees=degreesMult*(newValue-jG.ticks.start);if(valueDegrees>Math.abs(jG.segmentStart-jG.segmentEnd))
{if(jG.needle.limitAction===limitAction.autoRange)
{jG.ticks.end=findUpperLimit(newValue,10);jG.updateTicks();valueDegrees=newValue*(jG.segmentEnd-jG.segmentStart)/(jG.ticks.end-jG.ticks.start);}
else if(jG.needle.limitAction===limitAction.clamp)
{valueDegrees=Math.abs(jG.segmentStart-jG.segmentEnd);$('#'+jG.id+'-needle').animate({top:'+=2',left:'-=2'},50).animate({top:'-=2',left:'+=2'},50).animate({top:'+=2',left:'-=2'},50).animate({top:'-=2',left:'+=2'},50);}}
$('#'+jG.id+'-needle').rotateAnimation(jG.segmentStart+valueDegrees);$('#'+jG.id+'-needle').css('position','absolute');needleCssLeft=Math.round(jG.centerX-$('#'+jG.id+'-needle').width()/2+jG.needle.xOffset)+'px';needleCssTop=Math.round(jG.centerY-$('#'+jG.id+'-needle').height()/2+jG.needle.yOffset)+'px';$('#'+jG.id+'-needle').css({'left':needleCssLeft,'top':needleCssTop});htmlString=prefixNumber(newValue,true);$('#'+jG.id+'-label').html(htmlString);}
function getValue()
{return this.value;}
function prefixNumber(value,formatting)
{var power=0;var prefix='';switch(jG.autoPrefix)
{case autoPrefix.si:while(value>=1000)
{power++;value/=1000;}
prefix=jG.siPrefixes[power];break;case autoPrefix.binary:while(value>=1024)
{power++;value/=1024;}
prefix=jG.binaryPrefixes[power];break;}
if(formatting===true)
{return jG.label.prefix+'<strong>'+addCommas(numberPrecision(value,jG.label.precision))+'</strong> '+prefix+jG.label.suffix;}
else
{return addCommas(numberPrecision(value,jG.label.precision))+prefix;}}
function findUpperLimit(value,multiple)
{var power=0;var bump=0;if(jG.autoPrefix===autoPrefix.binary)
{while(value>=2)
{power++;value/=2;}
return Math.pow(2,power+1);}
else
{multiple/=10;while(value>=10)
{power++;value/=10;}
while(value>bump)
{bump+=multiple;}
return parseInt(bump*Math.pow(10,power),10);}}}
numberPrecision=function(value,decimals)
{return Math.round(value*Math.pow(10,decimals))/Math.pow(10,decimals);};addCommas=function(nStr)
{nStr+='';var x=nStr.split('.');var x1=x[0];var x2=x.length>1?'.'+x[1]:'';var rgx=/(\d+)(\d{3})/;while(rgx.test(x1))
{x1=x1.replace(rgx,'$1'+','+'$2');}
return x1+x2;};(function($)
{$.fn.getHiddenDimensions=function(boolOuter)
{var $item=this;var props={position:'absolute',visibility:'hidden',display:'block'};var dim={'w':0,'h':0};var $hiddenParents=$item.parents().andSelf().not(':visible');var oldProps=[];$hiddenParents.each(function()
{var old={};for(var name in props)
{old[name]=this.style[name];this.style[name]=props[name];}
oldProps.push(old);});if(!false===boolOuter)
{dim.w=$item.outerWidth();dim.h=$item.outerHeight();}
else
{dim.w=$item.width();dim.h=$item.height();}
$hiddenParents.each(function(i)
{var old=oldProps[i];for(var name in props)
{this.style[name]=old[name];}});return dim;};}(jQuery));
