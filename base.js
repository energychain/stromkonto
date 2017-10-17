var sko_sc="0x19BF166624F485f191d82900a5B7bc22Be569895";
var xferkto="0x5856b2AE31ed0FCf82F02a4090502DC5CCEec93E";
var pers_sc="";
var history_length=15;
var last_block=0;
var account_interval=0;
var chart_data=[];

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
	if(name.length<1) name=address;
	return name;
}

function getBlockTime(blocknr,cb) {
	if(typeof window.localStorage.getItem("block_"+blocknr)!="undefined") 
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
					$('.btnxferkto').attr('href','?account='+$('#account').val()+'&sc='+xferkto);
					$('.btnxferkto').removeAttr('disabled');
				} else {
					$('.btnxferkto').attr('disabled','disabled');
				}
				if(tx!="0x0000000000000000000000000000000000000000") {
					if(sko_sc!=tx) {
						$('.btnunterbilanzierung').attr('href','?account='+$('#account').val()+'&sc='+tx);
						$('.btnunterbilanzierung').removeAttr('disabled');
					}
				} else {
					$('.btnunterbilanzierung').attr('disabled','disabled');
				}	
				pers_sc=tx;				
			});
		});	
}

function balanceAccount(account) {
	var balance=0;	
	balance=$('#v_haben_'+account).attr('data')-$('#v_soll_'+account).attr('data');
	balance/=10000000;
	$('#v_saldo_'+account).html(balance.toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 }));
	if(balance<0) {
			$('#v_saldo_'+account).css("color","red");
		} else {
			$('#v_saldo_'+account).css("color","black");
		}
	tbalance();
}

function ebalanceAccount(account) {
	var balance=0;	
	balance=$('#e_haben_'+account).attr('data')-$('#e_soll_'+account).attr('data');
	balance/=1000;
	$('#e_saldo_'+account).html(balance.toLocaleString(undefined, { minimumFractionDigits:3, maximumFractionDigits:3 }));	
	if(balance<0) {
		$('#e_saldo_'+account).css("color","red");
	} else {
		$('#e_saldo_'+account).css("color","black");
	}
	tbalance();
}

function tbalance() {
	var v_soll =0; $.each($('.v_soll'),function(i,v) { v_soll+=$(v).attr("data")*1; });
	var v_haben =0; $.each($('.v_haben'),function(i,v) { v_haben+=$(v).attr("data")*1; });
	var v_saldo =0; $.each($('.v_saldo'),function(i,v) { v_saldo+=$(v).attr("data")*1; });
	var p_soll =0; $.each($('.b_soll'),function(i,v) { p_soll+=$(v).attr("data")*1; });
	var p_haben =0; $.each($('.b_haben'),function(i,v) { p_haben+=$(v).attr("data")*1; });
	var p_saldo =0; $.each($('.b_saldo'),function(i,v) { p_saldo+=$(v).attr("data")*1; });
	
}
function blk_sc(account) {
node.stromkonto(sko_sc).then(function(sko) {
		sko.balancesSoll(account).then(function(v) {								
				$('#v_soll_'+account).html((v/10000000).toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 }))				
				$('#v_soll_'+account).attr('data',v);
				balanceAccount(account);	
		});
		sko.balancesHaben(account).then(function(v) {				
				$('#v_haben_'+account).html((v/10000000).toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 }))
				$('#v_haben_'+account).attr('data',v);
				balanceAccount(account);
		});
		sko.baseSoll(account).then(function(v) {								
				$('#e_soll_'+account).html((v/1000).toLocaleString(undefined, { minimumFractionDigits:3, maximumFractionDigits:3 }))
				$('#e_soll_'+account).attr('data',v);
				ebalanceAccount(account);	
		});
		sko.baseHaben(account).then(function(v) {				
				$('#e_haben_'+account).html((v/1000).toLocaleString(undefined, { minimumFractionDigits:3, maximumFractionDigits:3 }))
				$('#e_haben_'+account).attr('data',v);
				ebalanceAccount(account);
		});
});	
	
}

function open_blk() {
	$('#sko_blance').hide();
	$('#blk_balance').show();
	$('#edit_alias').hide();
	$('#dsp_account').html("Salden Bilanzgruppe");
	var accounts = [];
	
	if(window.localStorage.getItem("balance_accounts")!=null) {
			var adrbk=window.localStorage.getItem("balance_accounts");
			adrbk=adrbk.split(',');
			$.each(adrbk,function(i,v) {
					accounts.push(v);
			});
	}	
	if(accounts.length==0) {
		accounts.push(node.wallet.address);	
	}
	var html="<table class='table table-striped'>";	
	html+="<tr><th>Konto</th><th style='text-align:right'>Soll</th><th style='text-align:right'>Haben</th><th style='text-align:right'>Saldo</th></tr>";
	var pvalue = html;
	var penergy = html;
	
	var pvalue_last="";
	var penergy_last="";
	
	$.each(accounts,function(i,v) {
			if(v.length>1) {
				var rvalue="";
				var renergy="";
				
				rvalue+="<tr><td><a href='?account="+v+"&sc="+sko_sc+"'>"+lookup(v)+"</a></td>";
				renergy+="<tr><td><a href='?account="+v+"&sc="+sko_sc+"'>"+lookup(v)+"</a></td>";
				
				rvalue+="<td id='v_soll_"+v+"' style='text-align:right' data='0' class='v_soll'>0,00</td>";
				renergy+="<td id='e_soll_"+v+"' style='text-align:right' data='0' class='b_soll'>0,000</td>";
				rvalue+="<td id='v_haben_"+v+"' style='text-align:right' data='0' class='v_haben'>0,00</td>";
				renergy+="<td id='e_haben_"+v+"' style='text-align:right' data='0' class='b_haben'>0,000</td>";					
				rvalue+="<td id='v_saldo_"+v+"' style='text-align:right' data='0' class='v_soll'>0,00</td>";
				renergy+="<td id='e_saldo_"+v+"' style='text-align:right' data='0' class='b_soll'>0,000</td>";
				
				rvalue+="</tr>";
				renergy+="</tr>";
											
				blk_sc(v);
				if(i==0) {						
						pvalue_last=rvalue;
						penergy_last=renergy;						
				} else {
						pvalue+=rvalue;
						penergy+=renergy;
				}				
			}
	});
	pvalue_last=pvalue_last.replace(/td/g, 'th');
	penergy_last=penergy_last.replace(/td/g, 'th');
	pvalue+=pvalue_last
	pvalue+="</table>";
	penergy+=penergy_last
	penergy+="</table>";
	
	
	$('#pvalue').html(pvalue);
	$('#penergy').html(penergy);
	$('#btn_balance_add').click(function() {
			add_BLK();
			open_blk();
	});
	
}

function add_BLK() {
	
			var accounts = [];
	
			if(window.localStorage.getItem("balance_accounts")!=null) {
					var adrbk=window.localStorage.getItem("balance_accounts");
					adrbk=adrbk.split(',');
					$.each(adrbk,function(i,v) {
							accounts.push(v);
					});
			}	
			if(accounts.length==0) {
				accounts.push(node.wallet.address);	
			}
			accounts.push($("#nblcadr").val());
			var uniqueAccounts=[];
			$.each(accounts, function(i, el){
					if($.inArray(el, uniqueAccounts) === -1) uniqueAccounts.push(el);
			});
			window.localStorage.setItem("balance_accounts",uniqueAccounts);
				
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
				$('#sko_blance').show();
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
	const ipfs = new Ipfs()

		ipfs.on('ready', () => {
		  // Your node is now ready to use \o/
		  
		  // stopping a node
		  
		})
						
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
						$('#transfer_text').val("/ipfs/"+files[0].hash);
						$('#transfer_text').attr('readonly','readonly');
						$.get("https://ipfs.io/ipfs/"+files[0].hash,function(data) {});
						$.get("https://stromdao.de/ipfs/"+files[0].hash,function(data) {});
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
	if(tx.text.substr(0,6)=="/ipfs/") {
		$('#refForm').hide();
		$('#btnrefownload').show();
		$('#btnrefownload').attr('href',"https://stromdao.de/"+tx.text);
		$('#transfer_text').attr('readonly','readonly');
	} else { 		
		$('#refForm').show();
		$('#transfer_text').removeAttr('readonly');
		$('#btnrefownload').hide();
	}
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
	node = new document.StromDAOBO.Node({external_id:extid,testMode:true,rpc:"https://fury.network/rpc",abilocation:"./abi/"});
	$('.account').html(lookup(node.wallet.address));
	//$('#account').val(node.wallet.address);

	window.clearInterval(account_interval);
	open_subbalance();
	$('#sko_transfer').hide();
	$('#kto_frm').hide();
	$('#blk_balance').hide();	
	var html=":&nbsp;";
	html=node.wallet.address+"@"+sko_sc;	
	$('#dsp_account').attr('title',html);
	var account=$('#account').val();	
	$('#dsp_account').attr('class',account);
	$('#dsp_account').attr('data',account);
	$('#dsp_account').html(lookup(account));	
	if(sko_sc==xferkto) {
			open_xferkto();
			return;
	}
	$('#enerstat').show();
	var sko_name=sko_sc;
	if(lookup(sko_sc)==sko_name) {
		sko_name="Stromkonto Abrechnung";
	} else {
			sko_name=lookup(sko_sc);
	}
	$('#dsp_sc').html(sko_name);
	chart_data=[];
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
					$('#edit_alias').show();				
					if(owner[0]!=account) {
						$('#edit_alias').show();
					sko.history(account,10000).then(function(history) {	
							history=history.reverse();
							var html="<table class='table table-striped'>";
							html+="<tr><th>Konsens</th><th>Von</th><th>An</th><th>&nbsp;</th><th align='right' style='text-align:right'>Energie</th><th align='right' style='text-align:right'>Geld</th>";					
							var saldo=0;					
							$.each(history,function(i,v) {
								if(i<history_length) {
									html+="<tr>";
									html+="<td class='block_"+v.blockNumber+" blocks' data='"+v.blockNumber+"' data-value='"+(parseInt(v.value, 16)/10000000)+"'>#"+v.blockNumber+"</td>";
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
												var datapoint={};
												datapoint.x=new Date(o);
												datapoint.y=$(v).attr("data-value");
												chart_data.push(datapoint);
									});
								});
							}		
							$('#dsp_account').html(lookup(account));					
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
									add_BLK(ref);
									html+="<tr>";
									html+="<td class='block_"+v.blockNumber+" blocks' data='"+v.blockNumber+"' data-value='"+saldo+"'>#"+v.blockNumber+"</td>";					
									html+="<td><a href='?account="+ref+"&sc="+sko_sc+"' class='"+ref+"'>"+lookup(ref)+"</a></td>";									
									html+="<td align='right' style='color:"+col+"'>"+(parseInt(v.base, 16)/1000*mul).toLocaleString(undefined, { minimumFractionDigits:3, maximumFractionDigits:3 })+"</td>";
									html+="<td align='right' style='color:"+col+"'>"+(parseInt(v.value, 16)/10000000*mul).toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 })+"</td>";							
									html+="</tr>";
									saldo+=(parseInt(v.value, 16)/1*mul)
								}
							});
														
							if(history.length>0) {
								html+="<tr><td colspan='6' align='right' style='text-align:right'><button id='more10' class='btn btn-default'>Ältere Umsätze</button></td></tr>";
								html+="</table>";
								$('#history').html(html);								
								$.each($('.blocks'),function(i,v) {
									getBlockTime($(v).attr("data"),function(o) {
												$(v).html(new Date(o).toLocaleString());
												var datapoint={};
												//datapoint.x=new Date(o);
												datapoint.push($(v).attr("data")*1);
												datapoint.push($(v).attr("data-value")*1);
												chart_data.push(datapoint);
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
						$('#dsp_account').html(lookup(account));					
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
			node.transferable(xferkto).then(function(sko) {
				sko.history(account,20000).then(function(history) {	
						if(history.length==0) {
							$('.btnxferkto').attr('disabled','disabled');
						} else {
							$('.btnxferkto').removeAttr('disabled');
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

try {
	var node = new document.StromDAOBO.Node({external_id:extid,testMode:true,rpc:"https://fury.network/rpc",abilocation:"./abi/"});
} catch(e) {	
	var node = new document.StromDAOBO.Node({external_id:Math.random(0,10000000),testMode:true,rpc:"https://fury.network/rpc",abilocation:"./abi/"});
}

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
		if(typeof window.localStorage.getItem("username") != "undefined") {
			$('#username').val(window.localStorage.getItem("username"));
			$('#password').val(window.localStorage.getItem("password"));
		}

			
		open_account();		
} else {
	$('#brain_frm').show();	
}


function reopenwithPK(pk) {	
	$('#pk_frm').hide();	
	window.localStorage.setItem("ext:"+extid,pk);
	window.localStorage.setItem("username",$('#username').val());
	window.localStorage.setItem("password",$('#password').val());
	
	node = new document.StromDAOBO.Node({external_id:extid,testMode:true,rpc:"https://fury.network/rpc",abilocation:"./abi/"});
	account=node.wallet.address;
	node.roleLookup().then(function(rl) {
			rl.relations(node.wallet.address,42).then(function(blk) {
					console.log("BLK",blk);
					if(blk!="0x0000000000000000000000000000000000000000") {
						sko_sc=blk;
						node.storage.setItemSync("last_sc",sko_sc);	
						
					} 
					location.href="?account="+node.wallet.address+"&sc="+sko_sc;					
			});
	});	
}

$('#open_username').click(function() {
	$('#open_username').attr('disabled','disabled');
	var account_obj=new document.StromDAOBO.Account($('#username').val(),$('#password').val());
	account_obj.wallet().then(function(wallet) {
			node.roleLookup().then(function(rl) {
					rl.relations(wallet.address,256).then(function(tx) {
							$('#brain_frm').hide();
							if(tx=="0x0000000000000000000000000000000000000000") {
									// Require PK									
									$('#pk_frm').show();
								} else {
									node.stringstorage(tx).then(function(ss) {
											ss.str().then(function(str) {
											account_obj.decrypt(str).then(function(pk) {
												console.log("PK",pk);
												window.localStorage.setItem("ext:"+extid,wallet.privateKey);
												var node = new document.StromDAOBO.Node({external_id:extid,testMode:true,rpc:"https://fury.network/rpc",abilocation:"./abi/"});
												
												rl.relations(wallet.address,51).then(function(profile_str) {
													// Open with PK
													if(profile_str!="0x0000000000000000000000000000000000000000") {
														node.stringstorage(profile_str).then(function(ss) {																
																ss.str().then(function(str) {
																console.log("Try to fetch","https://ipfs.io/ipfs/"+str);
																try {
																$.get("https://ipfs.io/ipfs/"+str,function(p) {
																	account_obj.decrypt(p).then(function(profile) {		
																		profile=JSON.parse(profile);
																		var typa=[];
																		$.each(profile,function(i,v) {
																				window.localStorage.setItem(i,v);
																				typa.push({name:v});
																		});	
																		var $input = $(".typeahead");
																		$input.typeahead({
																		  source: typa,
																		  autoSelect: true
																		});															
																		reopenwithPK(pk);
																		
																	});
																});
																} catch(e) {
																	reopenwithPK(pk);
																}
															});
														});	
													} else {
														reopenwithPK(pk);
													}																		
												});	
											});
										});
									});	
								
								}						
					});
			})				
	});	
});
$('#open_pk').click(function() {
	$('#open_pk').attr('disabled','disabled');
	$('#dsp_account').html($('#username').val());
	var account_obj=new document.StromDAOBO.Account($('#username').val(),$('#password').val());
	account_obj.wallet().then(function(wallet) {
		window.localStorage.setItem("ext:"+extid,wallet.privateKey);
		var node = new document.StromDAOBO.Node({external_id:extid,testMode:true,rpc:"https://fury.network/rpc",abilocation:"./abi/"});
		
		account_obj.encrypt($('#pk_secret').val()).then(function(enc) {
					node.stringstoragefactory().then(function(ssf)  {						
						ssf.build(enc).then(function(ss) {
							node.roleLookup().then(function(rl) {
									rl.setRelation(256,ss).then(function(tx) {
										reopenwithPK($('#pk_secret').val());
									});
							});
						});
					});							
				});
		});
});


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

var typa=[];
$.each(window.localStorage,function(a,b) {
					if(a.substr(0,"address_".length)=="address_") {						
							typa.push({name:b});
					}
});
var $input = $(".typeahead");
$input.typeahead({
  source: typa,
  autoSelect: true
});		
																		
$('#downloadStorage').click(function() {	
	const ipfs = new Ipfs()

		ipfs.on('ready', () => {
		  // Your node is now ready to use \o/
		  
		  // stopping a node
		  		
		$('#btn_downloadStorage').addClass('disabled');
		if(($('#username').val().length>0)&&($('#password').val().length>0)) {
			var adr={};
			
			$.each(window.localStorage,function(a,b) {
					if(a.substr(0,"address_".length)=="address_") {						
							adr[a]=b;
					}
					if(a.substr(0,"name_".length)=="name_") {						
							adr[a]=b;
					}
			})
			
			var adr_json=JSON.stringify(adr);
			
			
			var account_obj=new document.StromDAOBO.Account($('#username').val(),$('#password').val());
			account_obj.wallet().then(function(wallet) {						
						account_obj.encrypt(adr_json).then(function(enc) {						
						ipfs.files.add({path:'/storage.txt',content:new ipfs.types.Buffer(enc,'ascii')}, function (err, files) {	
							window.localStorage.setItem("ext:"+extid,wallet.privateKey);
							var node = new document.StromDAOBO.Node({external_id:extid,testMode:true,rpc:"https://fury.network/rpc",abilocation:"./abi/"});
						
							node.stringstoragefactory().then(function(ssf)  {						
								ssf.build(files[0].hash).then(function(ss) {
									node.roleLookup().then(function(rl) {
											rl.setRelation(51,ss).then(function(tx) {
												$('#btn_downloadStorage').removeClass('disabled');
												uriContent = "https://ipfs.io/ipfs/"+files[0].hash;
												newWindow = window.open(uriContent, 'Storage');
											});
									});
								});
							});							
						});
					});
			});			
		} else {
			$('#btn_downloadStorage').removeClass('disabled');
		}
	}); // END IPFS
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

$('#cancel_pk').click(function() {
		$('#open_username').removeAttr('disabled');
		$('#pk_frm').hide();
		$('#brain_frm').show();
});

$('#edit_alias').hide();
$('.dsp_sc').click(function() {open_blk();});
$('.btnunterbilanzierung').click(function() { open_account(); });
