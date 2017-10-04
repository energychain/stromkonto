var sko_sc="0x19BF166624F485f191d82900a5B7bc22Be569895";
var xferkto="0x19BF166624F485f191d82900a5B7bc22Be569895";

function nameLookup(address) {
		node.roleLookup().then(function(rl) {
			rl.getName(address).then(function(tx) {
				$('.'+address).html(tx);
			});
		});
}

function lookup(address) {
	name=address;
	if(window.localStorage.getItem("address_"+address)!=null) {
			name=window.localStorage.getItem("address_"+address);
	}
	return name;
}
function open_subbalance() {
	node.roleLookup().then(function(rl) {
			rl.relations($('#account').val(),42).then(function(tx) {
				if(sko_sc!=xferkto) {
					$('#btnxferkto').attr('href','?account='+$('#account').val()+'&sc=0x19BF166624F485f191d82900a5B7bc22Be569895');
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
			});
		});	
}

function open_account() {
	open_subbalance();
	$('#sko_transfer').hide();
	$('#kto_frm').hide();
	var html=":&nbsp;";
	html=node.wallet.address+"@"+sko_sc;
	$('#kto_heading').html(html);
	node.stromkonto(sko_sc).then(function(sko) {
		    var account=$('#account').val();	
		    $('#dsp_account').attr('class',account);
		    $('#dsp_account').attr('data',account);
		    $('#dsp_account').html(lookup(account));
			$('#edit_alias').show();
			node.mpr().then(function(mpr) {
					mpr.readings(account).then(function(o) {
							d=new Date((o.time.toString())*1000);
							$('#ts').html(d.toLocaleString());
							$('#power').html((o.power.toString()/1000).toFixed(3).toLocaleString());				
					});
			});	

		    nameLookup(account);
		    
			sko.balancesHaben(account).then(function(haben) {
				haben=haben/10000000;
				str_haben=haben.toFixed(2).toLocaleString();
				$('#account_haben').html(str_haben);
				$('#account_haben').attr('title',haben);
				if($('#account_haben').attr('title')-$('#account_soll').attr('title')<0) {
						$('.account_saldo').css('color','red');
				} else {
						$('.account_saldo').css('color','black');
				}
				$('.account_saldo').html(($('#account_haben').attr('title')-$('#account_soll').attr('title')).toFixed(2).toLocaleString());
			});
			sko.balancesSoll(account).then(function(soll) {
				soll=soll/10000000;
				str_soll=soll.toFixed(2).toLocaleString();
				$('#account_soll').html(str_soll);				
				$('#account_soll').attr('title',soll);		
				if($('#account_haben').attr('title')-$('#account_soll').attr('title')<0) {
						$('.account_saldo').css('color','red');
				} else {
						$('.account_saldo').css('color','black');
				}
				$('.account_saldo').html(($('#account_haben').attr('title')-$('#account_soll').attr('title')).toFixed(2).toLocaleString());
			});
			sko.baseSoll(account).then(function(soll) {
				soll=soll/1000;				
				str_soll=soll.toFixed(3).toLocaleString();
				$('#power_soll').html(str_soll);				
				$('#power_soll').attr('title',soll);		
				if($('#power_haben').attr('title')-$('#power_soll').attr('title')<0) {
						$('.power_saldo').css('color','red');
				} else {
						$('.power_saldo').css('color','black');
				}
				$('.power_saldo').html(($('#power_haben').attr('title')-$('#power_soll').attr('title')).toFixed(3).toLocaleString());
			});
			sko.baseHaben(account).then(function(haben) {
				haben=haben/1000;				
				str_haben=haben.toFixed(3).toLocaleString();
				$('#power_haben').html(str_haben);
				$('#power_haben').attr('title',haben);
				if($('#power_haben').attr('title')-$('#power_soll').attr('title')<0) {
						$('.power_saldo').css('color','red');
				} else {
						$('.power_saldo').css('color','black');
				}
				$('.power_saldo').html(($('#power_haben').attr('title')-$('#power_soll').attr('title')).toFixed(3).toLocaleString());
			});
			$('#sko_blance').show();
			sko.history(account,10000).then(function(history) {
					history=history.reverse();
					var html="<table class='table table-striped'>";
					html+="<tr><th>Block</th><th>Von</th><th>An</th><th align='right' style='text-align:right'>Energie</th><th align='right' style='text-align:right'>Geld</th>";					
					var saldo=0;					
					$.each(history,function(i,v) {
						if(i<5) {
							html+="<tr>";
							html+="<td>#"+v.blockNumber+"</td>";
							html+="<td><a href='?account="+v.from+"&sc="+sko_sc+"' class='"+v.from+"'>"+lookup(v.from)+"</a></td>";
							if((sko_sc==xferkto)&&(v.to.toLowerCase()==node.wallet.address)) {
								html+="<td><a href='?account="+v.to+"&sc="+sko_sc+"' class='"+v.to+"'>"+lookup(v.to)+"</a> - bestätigen</td>";
							} else {
								html+="<td><a href='?account="+v.to+"&sc="+sko_sc+"' class='"+v.to+"'>"+lookup(v.to)+"</a></td>";
							}
							html+="<td align='right'>"+(parseInt(v.base, 16)/1000).toFixed(3).toLocaleString()+"&nbsp;KWh</td>";
							html+="<td align='right'>"+(parseInt(v.value, 16)/10000000).toFixed(2).toLocaleString()+"&nbsp;€</td>";
							nameLookup(v.from);
							nameLookup(v.to);
							if(v.from.toLowerCase()==account.toLowerCase()) {
								saldo-=(parseInt(v.value, 16)/10000000);
							} else {
								saldo+=(parseInt(v.value, 16)/10000000);
							}
						}
					});
					saldo-=$('#account_haben').attr('title')-$('#account_soll').attr('title');
					html+="<tr><th colspan='4'>Anfangssaldo</th><th align='right' style='text-align:right'>"+saldo.toFixed(2).toLocaleString()+"&nbsp;€</th></tr>";
					html+="</table>";
					if(history.length>0) {
						$('#history').html(html);
					}
			});
			sko.owner().then(function(owner) {								
					if(owner[0]==node.wallet.address) {
						$('#show_transfer').show();
						$('#show_transfer').click(function() {
							$('#transfer_to').val("");
							$('#transfer_from').val("");
						});
						$('#tmpl_b64').hide();
						$('#show_transfer_to').click(function() {
							$('#transfer_from').val(lookup(node.wallet.address));
							$('#sko_blance').hide();
							$('#sko_transfer').show();
						});
						$('#show_transfer_from').click(function() {
							$('#transfer_to').val(lookup(node.wallet.address));
							$('#sko_blance').hide();
							$('#sko_transfer').show();
						});
						$('#show_transfer_free').click(function() {
							$('#sko_blance').hide();
							$('#sko_transfer').show();
						});
						$('#fnct_transfer_cancel').click(function() {
							$('#sko_blance').show();
							$('#sko_transfer').hide();
						});
						$('#fnct_transfer_template').click(function() {
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
							var str=btoa(JSON.stringify(tx));
							$('#tmpl_b64').val(str);
							$('#tmpl_b64').show();
							$('#tmpl_b64').attr('readonly','readonly');
							
							
						});
						$('#fnct_transfer_load').click(function() {
								if($('#tmpl_b64').is(":visible")) {
									var tx=JSON.parse(atob($('#tmpl_b64').val()));
									$('#transfer_from').val(lookup(tx.from));
									$('#transfer_to').val(lookup(tx.to));								
									$('#transfer_base').val(tx.base/1000);
									$('#transfer_value').val(tx.value/10000000);
									$('#tmpl_b64').hide();
									console.log(tx);
								} else {
									$('#tmpl_b64').show();
									$('#tmpl_b64').removeAttr('readonly');
								}								
						});
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

							
							if((from.toLowerCase()==node.wallet.address.toLowerCase())||(to.toLowerCase()==node.wallet.address.toLowerCase())) {
								
								if(from.toLowerCase()==node.wallet.address.toLowerCase()) {									
									var peer=to;
								}
								if(to.toLowerCase()==node.wallet.address.toLowerCase()) {									
									var peer=from;
								}
								
								node.assetsliabilitiesfactory().then(function(albf) {								
									albf.build(peer).then(function(anderkonto) {
										node.assetsliabilities(anderkonto).then(function(ianderkonto) {
											ianderkonto.addTx(from,to,$('#transfer_value').val()*10000000,$('#transfer_base').val()*1000).then(function(tx) {
												console.log("Tx1 (Anderkonto)",tx);												
												$('#status_transfer').html("Anderkonto eingerichtet.");	
												if(from.toLowerCase()==node.wallet.address.toLowerCase()) {
												sko.addTx(node.wallet.address,anderkonto,$('#transfer_value').val()*10000000,$('#transfer_base').val()*1000).then(function(tx) {
														$('#status_transfer').html("Konsens: Unterbilanz hergestellt");															
														node.stromkonto("0x19BF166624F485f191d82900a5B7bc22Be569895").then(function(sko_reply) {															
															sko_reply.addTx(anderkonto,to,$('#transfer_value').val()*10000000,$('#transfer_base').val()*1000).then(function(tx) {
																$('#status_transfer').html("Konsens: Transferkonto hergestellt");	
																$('#fnct_transfer').removeAttr('disabled');
																$('#fnct_transfer_cancel').removeAttr('disabled');
																$('#sko_blance').show();
																$('#sko_transfer').hide();					
																$('#status_transfer').html("");		
																open_account();															
															});
														});
													});												

												} else {
													sko.addTx(anderkonto,node.wallet.address,$('#transfer_value').val()*10000000,$('#transfer_base').val()*1000).then(function(tx) {
															$('#status_transfer').html("Konsens: Unterbilanz hergestellt");	
															node.stromkonto("0x19BF166624F485f191d82900a5B7bc22Be569895").then(function(sko_reply) {
																sko_reply.addTx(to,anderkonto,$('#transfer_value').val()*10000000,$('#transfer_base').val()*1000).then(function(tx) {
																	$('#status_transfer').html("Konsens: Transferkonto hergestellt");	
																	$('#fnct_transfer').removeAttr('disabled');
																	$('#fnct_transfer_cancel').removeAttr('disabled');
																	$('#sko_blance').show();
																	$('#sko_transfer').hide();					
																	$('#status_transfer').html("");		
																	open_account();															
																});
															});	
														});																																	
												}
											});
										});
										
									});
								});
								
							}	else
							{
								sko.addTx(from,to,$('#transfer_value').val()*10000000,$('#transfer_base').val()*1000).then(function(tx) {
								node.stromkonto("0x19BF166624F485f191d82900a5B7bc22Be569895").then(function(sko_reply) {									
								sko_reply.addTx(from,to,$('#transfer_value').val()*10000000,$('#transfer_base').val()*1000).then(function(tx) {
										$('#fnct_transfer').removeAttr('disabled');
										$('#fnct_transfer_cancel').removeAttr('disabled');
										$('#sko_blance').show();
										$('#sko_transfer').hide();					
										$('#status_transfer').html("");		
										open_account();					
										});
									});									
								}).catch(function(e) {
									$('#status_transfer').html("Fehler bei der Bestätigung");
									console.log(e);
									$('#fnct_transfer').removeAttr('disabled');
									$('#fnct_transfer_cancel').removeAttr('disabled');
								});
							}
						});
					}
			});
			$('#edit_alias').click(function() {
				$('#edit_alias').hide();
				var html="";
				html+='<div  class="form-inline"><input type="text" class="form-control" value="'+$('#dsp_account').html()+'" id="inedit"><button id="save_edit" class="btn btn-danger"><span class="glyphicon glyphicon-play-circle"></span></button></div>';
				 $('#dsp_account').html(html);	
				 $('#save_edit').click(function() {
					 window.localStorage.setItem("address_"+$('#dsp_account').attr('data'),$('#inedit').val());
					 window.localStorage.setItem("name_"+$('#inedit').val(),$('#dsp_account').attr('data'));
					 open_account();
				 });			
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
var node = new document.StromDAOBO.Node({external_id:extid,testMode:true,rpc:"https://demo.stromdao.de/rpc",abilocation:"https://cdn.rawgit.com/energychain/StromDAO-BusinessObject/master/smart_contracts/"});

// Fill View (HTML) using JQuery
$('.account').html(node.wallet.address);
$('#account').val(node.wallet.address);
$('#open_account').click(open_account);
if($.qparams("sc")!=null) {
		sko_sc=$.qparams("sc");		
}
if($.qparams("account")!=null) {
		$('#account').val($.qparams("account"));
		open_account();		
} else {
	$('#kto_frm').show();	
}
$('#sc').val(sko_sc);
