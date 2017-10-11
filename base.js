var sko_sc="0x19BF166624F485f191d82900a5B7bc22Be569895";
var xferkto="0x5856b2AE31ed0FCf82F02a4090502DC5CCEec93E";
var pers_sc="";
var history_length=15;
var last_block=0;
var account_interval=0;

function nameLookup(address) {
		if(node.storage.getItemSync("rl_name_"+address)==null) {
			node.roleLookup().then(function(rl) {
				rl.getName(address).then(function(tx) {
					$('.'+address).html(tx);
					node.storage.setItemSync("rl_name_"+address,tx);
				});
			});
		} else {
			$('.'+address).html(node.storage.getItemSync("rl_name_"+address));
		}
}

function lookup(address) {
	name=address;
	if(window.localStorage.getItem("address_"+address.toLowerCase())!=null) {
			name=window.localStorage.getItem("address_"+address.toLowerCase());
	}
	return name;
}

function getBlockTime(blocknr,cb) {
	if(window.localStorage.getItem("ablock_"+blocknr)==null) 
	{			
		$.ajax({
			url: "https://fury.network/rpc",
			type: 'POST',
			dataType: 'json',
			contentType: 'application/json',
			processData: false,
			data: '{"jsonrpc":"2.0","method":"eth_getBlockByNumber","params":["'+blocknr+'", true],"id":1}',
			success: function (data) {					
			  var ts=parseInt(data.result.timestamp)*1000;
			  window.localStorage.setItem("block_"+blocknr,ts);
			  cb(ts);
			},
			error: function(){
			  console.log("ERROR");
			}
		});
	} else {			
			cb(window.localStorage.getItem("block_"+blocknr)*1);
	}
}
function open_subbalance() {
	node.roleLookup().then(function(rl) {
			rl.relations($('#account').val(),42).then(function(tx) {
				if(sko_sc!=xferkto) {
					$('#btnxferkto').attr('href','?account='+$('#account').val()+'&sc='+xferkto);
					$('#btnxferkto').show();
				} else {
					$('#btnxferkto').hide();
				}
				if(tx!="0x0000000000000000000000000000000000000000") {
					if(sko_sc!=tx) {
						$('#btnunterbilanzierung').attr('href','?account='+$('#account').val()+'&sc='+tx);
						$('#btnunterbilanzierung').show();
					}
				} else {
					$('#btnunterbilanzierung').hide();
				}	
				pers_sc=tx;				
			});
		});	
}


function open_xferkto() {
	window.clearInterval(account_interval);
	$('#account').val(node.wallet.address);	
	open_subbalance();
	$('#sko_transfer').hide();
	$('#kto_frm').hide();
	var html=":&nbsp;";
	html=node.wallet.address+"@"+sko_sc;
	//$('#kto_heading').html(lookup(node.wallet.address));
	$('#dsp_account').attr('title',html);
	
	var account=$('#account').val();	
	$('#dsp_account').attr('class',account);
	$('#dsp_account').attr('data',account);
	$('#dsp_account').html("Transfers");
	$('#edit_alias').hide();
	$('#enerstat').hide();
	node.transferable(sko_sc).then(function(sko) {
			sko.history(account,20000).then(function(history) {	
			history=history.reverse();
			var html="<table class='table table-striped'>";
			html+="<tr><th>Konsens</th><th>Von</th><th>Art</th><th>&nbsp;</th><th align='right' style='text-align:right'>Energie</th><th align='right' style='text-align:right'>Geld</th>";					
			var saldo=0;							
			$.each(history,function(i,v) {
				if(v.sender.toLowerCase()!=node.wallet.address.toLowerCase()) { 
					if(i<150) {
						bc="#ffffff";
						if(node.storage.getItemSync("rcpt_"+v.blockNumber)!=null) {
								bc="#c0c0c0";							
						}
						html+="<tr style='background-color:"+bc+"'>";
						html+="<td class='block_"+v.blockNumber+",blocks'>#"+v.blockNumber+"</td>";
						html+="<td><a href='?account="+v.sender+"&sc="+pers_sc+"' class='"+v.sender+"'>"+lookup(v.sender)+"</a></td>";
						//console.log(v);
						var art="Geldeingang";
						if(v.data!="0000000000000000000000000000000000000000000000000000000000000001") art="Zahlungsavise";
						html+="<td title='"+v.msg+"'>"+art+"</td>";
						if(node.storage.getItemSync("rcpt_"+v.blockNumber)!=null) {
								html+="<td align=''><button class='btn btn-default applybtn' data-block='"+v.blockNumber+"' data-state='disabled' data-from='"+v.sender+"' data-msg='"+v.msg+"' data-to='"+v.recipient+"' data-base='"+parseInt(v.base, 16)+"' data-value='"+parseInt(v.value, 16)+"'>anzeigen</button></td>";	
						} else {
							html+="<td align=''><button class='btn btn-danger applybtn' data-block='"+v.blockNumber+"' data-from='"+v.sender+"' data-state='enabled' data-msg='"+v.msg+"' data-to='"+v.recipient+"' data-base='"+parseInt(v.base, 16)+"' data-value='"+parseInt(v.value, 16)+"'>übernehmen</button></td>";	
						}
						html+="<td align='right'>"+(parseInt(v.base, 16)/1000).toLocaleString(undefined, { minimumFractionDigits:3, maximumFractionDigits:3 })+"&nbsp;KWh</td>";
						html+="<td align='right'>"+(parseInt(v.value, 16)/10000000).toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 })+"&nbsp;€</td>";		
						html+="</tr>";			
					}
				}
			});
			saldo-=$('#account_haben').attr('title')-$('#account_soll').attr('title');			
			html+="</table>";			
			if(history.length>0) {
				$('#history').html(html);
			}
			$('.applybtn').click(function(o) {
					var from=$(o.currentTarget).attr('data-from');
					var to=$(o.currentTarget).attr('data-to');
					var base=$(o.currentTarget).attr('data-base');
					var value=$(o.currentTarget).attr('data-value');		
					var msg=$(o.currentTarget).attr('data-msg');
					var block=$(o.currentTarget).attr('data-block');
					var state=$(o.currentTarget).attr('data-state');
					if(state=="enabled") {
							$('#fnct_transfer').show();
							$('.tx').removeAttr('readonly');
					} else {
							$('#fnct_transfer').hide();
							$('.tx').attr('readonly','readonly');						
					}
					node.stringstorage(msg).then(function(str) {
						window.clearInterval(account_interval);
						str.str().then(function(msg) {
							$('#tmpl_b64').val(msg);
							loadb64();
							$('#sko_blance').hide();
							$('#sko_transfer').show();	
							skoEvents();
							$('#dsp_auftrag').html("Zahlungsavis");
							$('#fnct_transfer').click(function() {
								$('#fnct_transfer').attr('disabled','disabled');
								$('#fnct_transfer_cancel').attr('disabled','disabled');
								$('#status_transfer').html("Übermittle an Energy Blockchain");
								var from=$('#transfer_from').val();
								var to=$('#transfer_to').val();
								if(window.localStorage.getItem("name_"+from)!=null) {
									from=window.localStorage.getItem("name_"+from);
								}
								if(window.localStorage.getItem("name_"+to)!=null) {
									to=window.localStorage.getItem("name_"+to);
								}

								var peer=from;
								var liab=false;
								
								if(from.toLowerCase()==node.wallet.address) { peer=to; liab=true;} 
								node.stromkonto(pers_sc).then(function(sko) {	
									sko.addTx(from,to,$('#transfer_value').val()*10000000,$('#transfer_base').val()*1000).then(function(tx1) {																				
											$('#fnct_transfer').removeAttr('disabled');
											$('#fnct_transfer_cancel').removeAttr('disabled');
											$('#sko_blance').show();
											$('#sko_transfer').hide();					
											$('#status_transfer').html("");		
											node.storage.setItemSync("rcpt_"+block,tx1);
											open_account();																					
									});	
								});																	
							});	
						});
					});
								

								
			});			
		});			

	});
}

function skoEvents() {
	
						
		$('#show_transfer').show();
		$('#show_transfer').click(function() {
			$('#transfer_to').val("");
			$('#transfer_from').val("");
		});
		$('#tmpl_b64').hide();
		$('#show_transfer_to').click(function() {
			$('#dsp_auftrag').html("Auftrag - Überweisung");
			$('#transfer_from').val(lookup(node.wallet.address));
			$('#sko_blance').hide();
			window.clearInterval(account_interval);
			$('#sko_transfer').show();
		});
		$('#show_transfer_from').click(function() {
			$('#dsp_auftrag').html("Auftrag - Lastschrift");
			$('#transfer_to').val(lookup(node.wallet.address));
			$('#sko_blance').hide();
			window.clearInterval(account_interval);
			$('#sko_transfer').show();
		});
		$('#show_transfer_free').click(function() {
			$('#sko_blance').hide();
			window.clearInterval(account_interval);
			$('#sko_transfer').show();
		});
		$('#fnct_transfer_cancel').click(function() {
			$('#sko_blance').show();
			$('#sko_transfer').hide();
		});
		$('#fnct_transfer_template').click(function() {
			saveb64();
		});
		$('#fnct_transfer_load').click(function() {
				if($('#tmpl_b64').is(":visible")) {
					loadb64();
				} else {
					$('#tmpl_b64').show();
					$('#tmpl_b64').removeAttr('readonly');
				}								
		});	
	 $("#reffile").on("change", function (changeEvent) {

	  for (var i = 0; i < changeEvent.target.files.length; ++i) {
		(function (file) {               // Wrap current file in a closure.
		var loader = new FileReader();		  
		loader.readAsBinaryString(file);
		console.log(file.name);
		loader.onload = function (loadEvent) {
			if (loadEvent.target.readyState != 2)
			  return;
			if (loadEvent.target.error) {
			  alert("Error while reading file " + file.name + ": " + loadEvent.target.error);
			  return;
			}
		 ipfs.files.add({path:'/'+file.name,content:new ipfs.types.Buffer(loadEvent.target.result,'ascii')}, function (err, files) {
						$('#transfer_text').val("https://stromdao.de/ipfs/"+files[0].hash);
						$('#transfer_text').attr('readonly','readonly');
						//console.log(err,files);
			});
		 };
		})(changeEvent.target.files[i]);
		 
		}
	});	
}

function loadb64() {
	var tx=JSON.parse(atob($('#tmpl_b64').val()));
	$('#transfer_from').val(lookup(tx.from));
	$('#transfer_to').val(lookup(tx.to));								
	$('#transfer_base').val(tx.base/1000);
	$('#transfer_value').val(tx.value/10000000);
	$('#transfer_text').val(tx.text);
	$('#tmpl_b64').hide();
}

function saveb64() {
	var from=$('#transfer_from').val();
	var to=$('#transfer_to').val();
	if(window.localStorage.getItem("name_"+from)!=null) {
		from=window.localStorage.getItem("name_"+from);
	}
	if(window.localStorage.getItem("name_"+to)!=null) {
		to=window.localStorage.getItem("name_"+to);
	}
	
	var tx={};
	tx.from=from;
	tx.to=to;
	tx.base=$('#transfer_base').val()*1000;
	tx.value=$('#transfer_value').val()*10000000;
	tx.text=$('#transfer_text').val();
	
	var str=btoa(JSON.stringify(tx));
	$('#tmpl_b64').val(str);
	$('#tmpl_b64').show();
	$('#tmpl_b64').attr('readonly','readonly');
}
function open_account() {
	window.clearInterval(account_interval);
	open_subbalance();
	$('#sko_transfer').hide();
	$('#kto_frm').hide();
	$('#sko_blance').show();
	var html=":&nbsp;";
	html=node.wallet.address+"@"+sko_sc;	
	$('#dsp_account').attr('title',html);
	var account=$('#account').val();	
	$('#dsp_account').attr('class',account);
	$('#dsp_account').attr('data',account);
	$('#dsp_account').html(lookup(account));
	$('#edit_alias').show();
	if(sko_sc==xferkto) {
			open_xferkto();
			return;
	}
	$('#enerstat').show();
	node.stromkonto(sko_sc).then(function(sko) {

			node.mpr().then(function(mpr) {
					mpr.readings(account).then(function(o) {
							d=new Date((o.time.toString())*1000);
							$('#ts').html(d.toLocaleString());
							$('#power').html((o.power.toString()/1000).toLocaleString(undefined, { minimumFractionDigits:3, maximumFractionDigits:3 }));				
					});
			});	

		    nameLookup(account);
		    
			sko.balancesHaben(account).then(function(haben) {
				haben=haben/10000000;
				str_haben=haben.toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 });
				$('#account_haben').html(str_haben);
				$('#account_haben').attr('title',haben);
				if($('#account_haben').attr('title')-$('#account_soll').attr('title')<0) {
						$('.account_saldo').css('color','red');
				} else {
						$('.account_saldo').css('color','black');
				}								
				$('.account_saldo').html(($('#account_haben').attr('title')-$('#account_soll').attr('title')).toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 }));
				if($('#account_haben').attr('title')-$('#account_soll').attr('title')!=0) {
						$('#work_saldo').html((((($('#account_haben').attr('title')-$('#account_soll').attr('title')))/1)/($('#power_haben').attr('title')-$('#power_soll').attr('title'))).toLocaleString(undefined, { minimumFractionDigits:4, maximumFractionDigits:4 }));
				}
			});
			sko.balancesSoll(account).then(function(soll) {
				soll=soll/10000000;
				str_soll=soll.toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 });
				$('#account_soll').html(str_soll);				
				$('#account_soll').attr('title',soll);		
				if($('#account_haben').attr('title')-$('#account_soll').attr('title')<0) {
						$('.account_saldo').css('color','red');
				} else {
						$('.account_saldo').css('color','black');
				}
				$('.account_saldo').html(($('#account_haben').attr('title')-$('#account_soll').attr('title')).toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 }));
				if($('#account_haben').attr('title')-$('#account_soll').attr('title')!=0) {
						$('#work_saldo').html((((($('#account_haben').attr('title')-$('#account_soll').attr('title')))/1)/($('#power_haben').attr('title')-$('#power_soll').attr('title'))).toLocaleString(undefined, { minimumFractionDigits:4, maximumFractionDigits:4 }));
				}
			});
			sko.baseSoll(account).then(function(soll) {
				soll=soll/1000;				
				str_soll=soll.toLocaleString(undefined, { minimumFractionDigits:3, maximumFractionDigits:3 });
				$('#power_soll').html(str_soll);				
				$('#power_soll').attr('title',soll);		
				if($('#power_haben').attr('title')-$('#power_soll').attr('title')<0) {
						$('.power_saldo').css('color','red');
				} else {
						$('.power_saldo').css('color','black');
				}
				$('.power_saldo').html(($('#power_haben').attr('title')-$('#power_soll').attr('title')).toLocaleString(undefined, { minimumFractionDigits:3, maximumFractionDigits:3 }));
				if($('#account_haben').attr('title')-$('#account_soll').attr('title')!=0) {
						$('#work_saldo').html((((($('#account_haben').attr('title')-$('#account_soll').attr('title')))/1)/($('#power_haben').attr('title')-$('#power_soll').attr('title'))).toLocaleString(undefined, { minimumFractionDigits:4, maximumFractionDigits:4 }));
				}
			});
			sko.baseHaben(account).then(function(haben) {
				haben=haben/1000;				
				str_haben=haben.toLocaleString(undefined, { minimumFractionDigits:3, maximumFractionDigits:3 });
				$('#power_haben').html(str_haben);
				$('#power_haben').attr('title',haben);
				if($('#power_haben').attr('title')-$('#power_soll').attr('title')<0) {
						$('.power_saldo').css('color','red');
				} else {
						$('.power_saldo').css('color','black');
				}
				$('.power_saldo').html(($('#power_haben').attr('title')-$('#power_soll').attr('title')).toLocaleString(undefined, { minimumFractionDigits:3, maximumFractionDigits:3 }));
				if($('#account_haben').attr('title')-$('#account_soll').attr('title')!=0) {
						$('#work_saldo').html(((($('#power_haben').attr('title')-$('#power_soll').attr('title'))/($('#account_haben').attr('title')-$('#account_soll').attr('title')))/10).toLocaleString(undefined, { minimumFractionDigits:4, maximumFractionDigits:4 }));
				}
			});
			sko.owner().then(function(owner) {	
					$('#sko_blance').show();
					if(owner[0]!=node.wallet.address) {
						$('#edit_alias').show();
					sko.history(account,10000).then(function(history) {	
							history=history.reverse();
							var html="<table class='table table-striped'>";
							html+="<tr><th>Konsens</th><th>Von</th><th>An</th><th>&nbsp;</th><th align='right' style='text-align:right'>Energie</th><th align='right' style='text-align:right'>Geld</th>";					
							var saldo=0;					
							$.each(history,function(i,v) {
								if(i<history_length) {
									html+="<tr>";
									html+="<td class='block_"+v.blockNumber+" blocks' data='"+v.blockNumber+"'>#"+v.blockNumber+"</td>";
									html+="<td><a href='?account="+v.from+"&sc="+sko_sc+"' class='"+v.from+"'>"+lookup(v.from)+"</a></td>";
									if((sko_sc==xferkto)&&(v.to.toLowerCase()==node.wallet.address.toLowerCase())) {
										html+="<td><a href='?account="+v.to+"&sc="+sko_sc+"' class='"+v.to+"'>"+lookup(v.to)+"</a></td>";
									} else {
										html+="<td><a href='?account="+v.to+"&sc="+sko_sc+"' class='"+v.to+"'>"+lookup(v.to)+"</a></td>";
									}
									html+="<td align=''>&nbsp;</td>";
									html+="<td align='right'>"+(parseInt(v.base, 16)/1000).toLocaleString(undefined, { minimumFractionDigits:3, maximumFractionDigits:3 })+"&nbsp;KWh</td>";
									html+="<td align='right'>"+(parseInt(v.value, 16)/10000000).toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 })+"&nbsp;€</td>";
									nameLookup(v.from);
									nameLookup(v.to);
									if(v.from.toLowerCase()==account.toLowerCase()) {
										saldo-=(parseInt(v.value, 16)/10000000);
									} else {
										saldo+=(parseInt(v.value, 16)/10000000);
									}
								} else {
									
								}
							});
							saldo-=$('#account_haben').attr('title')-$('#account_soll').attr('title');
							html+="<tr><th colspan='5'>Anfangssaldo</th><th align='right' style='text-align:right'>"+saldo.toFixed(2).toLocaleString()+"&nbsp;€</th></tr>";
							html+="</table>";
							if(history.length>0) {
								$('#history').html(html);
								$.each($('.blocks'),function(i,v) {
									getBlockTime($(v).attr("data"),function(o) {
												$(v).html(new Date(o).toLocaleString());
									});
								});
							}							
						});						
					} else {

						sko.history(account,10000).then(function(history) {
							history=history.reverse();
							var html="<table class='table table-striped'>";
							html+="<tr><th>Konsens</th><th>Schuldner/Gläubiger</th><th align='right' style='text-align:right'>Energie (KWh)</th><th align='right' style='text-align:right'>Geld (€)</th></tr>";					
							

							
							var saldo=0;					
							$.each(history,function(i,v) {								
								if(i<history_length) {
									var col='#ff0000';
									var ref=v.to;
									var mul=-1;
									if(v.to.toLowerCase()==node.wallet.address.toLowerCase()) {
											ref=v.from;
											col='#000000';
											mul=1;
									}	
									html+="<tr>";
									html+="<td class='block_"+v.blockNumber+" blocks' data='"+v.blockNumber+"'>#"+v.blockNumber+"</td>";					
									html+="<td><a href='?account="+ref+"&sc="+sko_sc+"' class='"+ref+"'>"+lookup(ref)+"</a></td>";									
									html+="<td align='right' style='color:"+col+"'>"+(parseInt(v.base, 16)/1000*mul).toLocaleString(undefined, { minimumFractionDigits:3, maximumFractionDigits:3 })+"</td>";
									html+="<td align='right' style='color:"+col+"'>"+(parseInt(v.value, 16)/10000000*mul).toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 })+"</td>";							
									html+="</tr>";
								}
							});
														
							if(history.length>0) {
								html+="<tr><td colspan='6' align='right' style='text-align:right'><button id='more10' class='btn btn-default'>Ältere Umsätze</button></td></tr>";
								html+="</table>";
								$('#history').html(html);								
								$.each($('.blocks'),function(i,v) {
									getBlockTime($(v).attr("data"),function(o) {
												$(v).html(new Date(o).toLocaleString());
									});
									$('#more10').click(function() {
											history_length+=10;
											open_account();
									});
								});
							}
						});	
						
						skoEvents();
						$('#fnct_transfer').click(function() {
							$('#fnct_transfer').attr('disabled','disabled');
							$('#fnct_transfer_cancel').attr('disabled','disabled');
							$('#status_transfer').html("Übermittle an Energy Blockchain");
							var from=$('#transfer_from').val();
							var to=$('#transfer_to').val();
							if(window.localStorage.getItem("name_"+from)!=null) {
								from=window.localStorage.getItem("name_"+from);
							}
							if(window.localStorage.getItem("name_"+to)!=null) {
								to=window.localStorage.getItem("name_"+to);
							}

							var peer=from;
							var liab=false;
							
							if(from.toLowerCase()==node.wallet.address.toLowerCase()) { peer=to; liab=true;} 
							
							sko.addTx(from,to,$('#transfer_value').val()*10000000,$('#transfer_base').val()*1000).then(function(tx1) {
								$('#status_transfer').html("Erstelle Nachricht");
								node.stringstoragefactory().then(function(ssf) {
									saveb64();
									ssf.build($('#tmpl_b64').val()).then(function(msg) {
										$('#status_transfer').html("Übertrage Nachricht an Empfänger");
										node.transferable().then(function(transferable) {
											transferable.addRx(peer,msg,$('#transfer_value').val()*10000000,$('#transfer_base').val()*1000,liab).then(function(tx) {
												$('#fnct_transfer').removeAttr('disabled');
												$('#fnct_transfer_cancel').removeAttr('disabled');
												$('#sko_blance').show();
												$('#sko_transfer').hide();					
												$('#status_transfer').html("");		
												open_account();												
											});
										});	
									});	
								});
									
							});																		
						});
					}
			});
			$('#edit_alias').click(function() {
				$('#edit_alias').hide();
				var html="";
				html+='<div  class="form-inline"><input type="text" class="form-control" value="'+$('#dsp_account').html()+'" id="inedit"><button id="save_edit" class="btn btn-danger"><span class="glyphicon glyphicon-play-circle"></span></button></div>';
				 $('#dsp_account').html(html);	
				 $('#save_edit').click(function() {
					 window.localStorage.setItem("address_"+$('#dsp_account').attr('data').toLowerCase(),$('#inedit').val());
					 window.localStorage.setItem("name_"+$('#inedit').val(),$('#dsp_account').attr('data'));
					 open_account();
				 });			
			});
			node.transferable(sko_sc).then(function(sko) {
				sko.history(account,20000).then(function(history) {	
						if(history.length==0) {
							$('#btnxferkto').hide();
						} else {
							$('#btnxferkto').show();
						}
				});
			});	
	});
	node.rpcprovider.getBlockNumber().then(function(x) {
		$('#konsens_block').html(x);
		getBlockTime(x,function(y) {
		$('#konsens_time').html(new Date(y).toLocaleString());	
		});
	});	
}

$.qparams = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null){
       return null;
    }
    else{
       return decodeURI(results[1]) || 0;
    }
}

var extid="1234";

if($.qparams("extid")!=null) {
	extid=$.qparams("extid");
}
var pk=null;
if($.qparams("pk")!=null) {
	pk=$.qparams("pk");
	window.localStorage.setItem("ext:"+extid,pk);
}
var node = new document.StromDAOBO.Node({external_id:extid,testMode:true,rpc:"https://fury.network/rpc",abilocation:"https://raw.githubusercontent.com/energychain/StromDAO-BusinessObject/master/smart_contracts/"});

// Fill View (HTML) using JQuery
$('.account').html(node.wallet.address);
$('#account').val(node.wallet.address);
$('#open_account').click(open_account);
if($.qparams("sc")!=null) {
		sko_sc=$.qparams("sc");	
		node.storage.setItemSync("last_sc",sko_sc);	
} else {
		if(node.storage.setItemSync("last_sc")!=null) {
			sko_sc=$.qparams("sc");	
		}	
}
if($.qparams("account")!=null) {
		$('#account').val($.qparams("account"));				
		open_account();		
} else {
	$('#kto_frm').show();	
}
$('#sc').val(sko_sc);

$('#pk').val(node.wallet.privateKey);

$('#btnunlock').click(function() {
	window.clearInterval(account_interval);
	$('#unlocked').toggle();	
	$('#btnunlock').toggle();	
	$('#btnlockit').click(function() {
			if(node.wallet.privateKey!=$('#pk').val()) {
				window.localStorage.setItem("ext:"+extid,$('#pk').val());
				location.reload();
			}
	});
});
$('#switchuser').click(function() {
	location.href="?account="+node.wallet.address+"&sc="+sko_sc;
});
$('#downloadStorage').click(function() {	
		uriContent = "data:application/octet-stream," + encodeURIComponent(JSON.stringify(window.localStorage));
		newWindow = window.open(uriContent, 'Storage');
});
$('#uploadStorage').click(function() {
	$('#upForm').show();
	$("#myfile").on("change", function (changeEvent) {
	  for (var i = 0; i < changeEvent.target.files.length; ++i) {
		(function (file) {               // Wrap current file in a closure.
		  var loader = new FileReader();
		  loader.onload = function (loadEvent) {
			if (loadEvent.target.readyState != 2)
			  return;
			if (loadEvent.target.error) {
			  alert("Error while reading file " + file.name + ": " + loadEvent.target.error);
			  return;
			}
			var tokens=JSON.parse(loadEvent.target.result);
			$.each( tokens, function( key, value ) {
					window.localStorage.setItem(key,value);
			});
			location.reload();
		  };
		  loader.readAsText(file);
		})(changeEvent.target.files[i]);
	  }
	});	
});

const ipfs = new Ipfs()

ipfs.on('ready', () => {
  // Your node is now ready to use \o/
  
  // stopping a node
  
})
