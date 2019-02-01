let webview_wallet = null;
let market_data = null;

$.qparam = function (name) {
    var results = new RegExp('[\?&]' + name + '=([^&#]*)')
                      .exec(window.location.search);

    return (results !== null) ? results[1] || 0 : false;
}

function resolvAddress(address) {    
    address=(""+address).toLowerCase();
    if(address=="0x445c1e284c15a50a69fe7d6dcd9fba3b938b52bb") return " Eigenerzeugung aus Corrently Anlagen";
    if(address=="0xdcbab2b1c28b6f57c367f4eff0f5c7893400cc4d") return "Grünstrombonus";
    if(address=="0x961aa3954c3af05c975433f095e9567780a4d6d2") return "Epiktet Beteiligung - Solar Rhein-Neckar";
    if(address=="0x41b7931ea8f072dcc77f1f682cd5a1273ff7dbe6") return "Epiktet Beteiligung - Solar Saarland";
    if(address=="0xabbd396e4e96517a63a834a3177f8b2809e1bd6682547f1d07bc5bf8073a99d3") return "Epiktet Beteiligung - Solar Rhein-Neckar";
    if(address=="0xc24f09705a3c5aec517bfad76761e05f6701cf75b5b7652da13b6e5279e47617") return "Epiktet Beteiligung - Solar Saarland";
    return address;
}

function webview_save(cb) {
    if(window.localStorage.getItem("webview")==null) return;
    let data = {};
    let keys = Object.keys(localStorage);
    for(var i=0;i<keys.length;i++) {
        data[keys[i]]=window.localStorage.getItem(keys[i]);
    }           
    if(data !=null) {
        $.post('https://api.corrently.io/core/webuser',data,function(c) { 
            if(typeof cb == "function") cb();
        });
    }
}
           
function webview() {
    if(typeof window.localStorage.getItem("webview")!=null) {
        webview_save();
    }
    window.localStorage.clear();
    // open wallet
    let wallet = new CorrentlyWallet.default.Wallet(CorrentlyWallet.default.utils.id($('#web_name').val()+"@"+$('#web_password').val()),new CorrentlyWallet.default.providers.JsonRpcProvider("https://node.corrently.io/"));
    window.localStorage.setItem("webview",wallet.address);
    webview_wallet=wallet;
    $.getJSON('https://api.corrently.io/core/webuser?webview='+wallet.address,function(viewdata) {
        if(typeof viewdata.webview == "undefined") {
            $('#btn_webview').hide();
            $('#valigroup').show();
            $('#btn_vali').click(function() {
                if($('#web_password').val()==$('#pwd2').val()) {
                     $('#valigroup').hide();
                        let data = {};
                        data.webview=wallet.address;
                        data.account_alias=$('#account').val();
                      $.post('https://api.corrently.io/core/webuser',data,function(c) {                           
                               $('.corrently-panels').hide();        
                               $('.appcontent').show();
                      });
                } else {
                    alert("Passwörter stimmen nicht überein");
                }
            })
        } else {
            let keys = Object.keys(viewdata);
            for(var i=0;i<keys.length;i++) {
                    window.localStorage.setItem(keys[i],viewdata[keys[i]]);
            }            
            $('.corrently-panels').hide();        
            $('.appcontent').show();
        }
    })
}

let stromkonto_data= {};
stromkonto_data.txpage=0;
let stromkonto_txs = [];
stromkonto_txs.last_balance_eur=0;
let bc_status = {};

function initVue()  {
$('.corrently-panels').hide();        
  let view = new Vue({
        el: '#app',
        data: stromkonto_data});
  $('#app').attr("initialized","true");
  $('.appcontent').show();      
                
}
function initBCStatus() {
    bc_status.blocktime="";
    bc_status.blocknumber = "";
    
    let view = new Vue({
        el: '#bcstatus',
        data: bc_status});
    $('#bcstatus').attr("initialized","true");    
    setInterval(updateBCStatus,60000);
    updateBCStatus();
}

function updateBCStatus() {    
    let wallet = new CorrentlyWallet.default.Wallet(CorrentlyWallet.default.Wallet.createRandom().privateKey,new CorrentlyWallet.default.providers.JsonRpcProvider("https://node.corrently.io/rpc", { chainId: 42 }));    
    wallet.provider.getBlockNumber().then(function(l) { 
            bc_status.blocknumber=l;
    } );
}
function gsiTable() {
    
    var html="";   
    if(typeof stromkonto_data.account.gsi == "undefined") {
        
        $.getJSON("https://api.corrently.io/core/gsi?plz=69256",function(gsi) {            
            stromkonto_data.account.gsi=gsi;
            stromkonto_data.account.gsi.bonus=0.05;
            $('#info_gsi_ort').html("<strong>DEMO:</strong> Grünstrom Bonus von Mauer (bei Heidelberg)");
            gsiTable();
        });
        return;
    }
    //if(typeof stromkonto_data.account.gsi.forecast == "undefined") return;
    //if(typeof stromkonto_data.account.gsi.bonus == "undefined") return;
    console.log("Account gsi();");
    stromkonto_data.green_power = (stromkonto_data.account.gsi.points/(stromkonto_data.account.gsi.points+stromkonto_data.account.gsi.residual)*100).toFixed(1).replace('.',',');
    
    $('#gsi_bonus').html((stromkonto_data.account.gsi.bonus*100).toFixed(2).replace('.',','));
    html+="<table class='table table-sm table-responsive' style='margin:0px;'>";
    let row_time="<td class='bg-secondary text-light'>Uhrzeit</td>";
    let row_day="<td class='bg-secondary text-light'>&nbsp;</td>";
    let row_bonus="<td>Cent/kWh</td>";
    let lastdate="";
    
    for(var i=0;i<stromkonto_data.account.gsi.forecast.length;i++) {
        let item=stromkonto_data.account.gsi.forecast[i];
        let ts=item.epochtime*1000;
        var today = new Date(ts);
        var dd = today.getDate();
        var mm = today.getMonth()+1; 
        var yyyy = today.getFullYear();
        var datestr = dd+"."+mm;
        if(ts>new Date().getTime()) {
            if(item.eevalue < 30) row_bonus+="<td class='bg-danger gsi'  style='text-align:center' title='"+item.eevalue+"%'>"; else
            if(item.eevalue > 70) row_bonus+="<td class='bg-success gsi' style='text-align:center' title='"+item.eevalue+"%'>"; else
            row_bonus+="<td class='bg-warning gsi' style='text-align:center' title='"+item.eevalue+"%'>";
            row_bonus+=(stromkonto_data.account.gsi.bonus*item.eevalue).toFixed(2).replace('.',',')
            row_bonus+="</td>";
            row_time+="<td class='bg-secondary text-light gsi' style='min-widht:70px;text-align:center' title='"+new Date(ts).toLocaleString()+"'>";
            row_time+=new Date(ts).getHours()+":00";
            row_time+="</td>";     
            
            if(datestr!=lastdate) {
                lastdate=datestr;
            row_day+="<td class='bg-secondary text-light' style='min-widht:70px;text-align:center;border-left:1px solid #c6c6c6' title='"+new Date(ts).toLocaleString()+"'>";    
                row_day+="<strong>"+datestr+"</strong>";
                
            } else {
                row_day+="<td class='bg-secondary text-light' style='min-widht:70px;text-align:center;' title='"+new Date(ts).toLocaleString()+"'>";
                row_day+="&nbsp;";
            }
            row_day+="</td>";     
        }
    }    
    html+="<tr>"+row_day+"</tr>";
    html+="<tr>"+row_time+"</tr>";
    html+="<tr style='height:45px;'>"+row_bonus+"</tr>";
    html+="</table>";
    $('#gsi').html(html);
    $('#gsi').show();
    $('#gsi_card').show();
}

function timeStamp(blockNumber) {
    let ts = window.localStorage.getItem("ts_"+blockNumber);
    if(ts==null) {
        let provider = new CorrentlyWallet.default.providers.JsonRpcProvider('https://node.corrently.io/rpc', { chainId: 42 });
        provider.getBlock(blockNumber).then(function(bi) {
            ts = bi.timestamp;
            window.localStorage.setItem("ts_"+blockNumber,ts);
            for(var i=0;i<stromkonto_data.txs.length;i++) {
                if(stromkonto_data.txs[i].blockNumber==blockNumber) {
                    stromkonto_data.txs[i].timeStamp=new Date(ts*1000).toLocaleString();
                }
            }
        });
        return "#"+blockNumber;
    } else return new Date(ts*1000).toLocaleString();
}
function osSubscribe() {   
    if($('#account').val().length==42) {
        let sko="sko_"+$('#account').val();
        let tags = {stromkonto: $('#account').val()};
        tags["gsi_"+$('#account').val()]="Y";   
        if((location.hostname!="localhost")&&(location.hostname!="127.0.0.1")) {
            OneSignal.sendTags(tags).then(function(x) {  });
        }
        $.getJSON("https://api.corrently.io/notification/stromkonto_notify?account="+$('#account').val(),function(d) {});
    }
}
function openAccount() {    
    $('.corrently-panels').hide();        
    $('.appcontent').show();
    window.localStorage.removeItem("alias_dress");
    if(window.localStorage.getItem("webview") != null) {
        $('#webuser').html(" | "+window.localStorage.getItem("webview"));
    }
    $('#account_nr').html($('#account').val());
    if((($('#account_alias').val()+"").length>0)&&($('#account_alias').val()!="dress")) {
        if(window.localStorage.getItem("alias_"+$('#account_alias').val())==null) {
            window.localStorage.setItem("alias_"+$('#account_alias').val(),$('#account').val());     
            webview_save();                
        }
        $('#frm_panel').hide(); 
        $('.appcontent').show();
    }
    if((($('#account').val()+"").length!=42)&&($('#account_alias').val()!="dress")) {
        $('#account').val(window.localStorage.getItem("alias_"+$('#account').val()));
    }   
    let keys = Object.keys(localStorage);
    for(var i=0;i<keys.length;i++) {      
        if((window.localStorage.getItem(keys[i])==$('#account').val())&&(keys[i].substr(6)!="dress")) {
            $('#account_alias').val(keys[i].substr(6));            
             $('#account_nr').html(keys[i].substr(6));
        }
    }
     $('#account_nr').attr('title',$('#account').val());
    window.localStorage.setItem("lastAddress",$('#account').val());
    CorrentlyWallet.default.Stromkonto($('#account').val()).then(function(l) { 
        CorrentlyWallet.default.CorrentlyAccount($('#account').val()).then(function(account) {
                stromkonto_data = l.result;
                updateMarket();
                if(typeof account.ap == "undefined") {
                    $('#tarifalert').removeClass('d-none');
                }
                stromkonto_data.green_power = "-";
                stromkonto_data.account = account;
                if(typeof stromkonto_data.account.generation != "undefined") {    
                    stromkonto_data.account.preGain=stromkonto_data.account.generation;
                    if((stromkonto_data.haben!=0)&&(typeof stromkonto_data.account.ap != "undefined")) {
                        stromkonto_data.account.clearedGeneration+=(stromkonto_data.haben/stromkonto_data.account.ap)/100000;
                    }                       
                    if(typeof stromkonto_data.account.clearedGeneration == "undefined") stromkonto_data.account.clearedGeneration=0;
                    stromkonto_data.account.gain=stromkonto_data.account.clearedGeneration-  stromkonto_data.account.preGain;
                   
                    stromkonto_data.generation_3f=stromkonto_data.account.clearedGeneration.toFixed(3).replace('.',',');                     
                } else {
                    stromkonto_data.generation_3f=0;
                }
                if(typeof stromkonto_data.account.nominalCori != "undefined") {
                    stromkonto_data.kwha= stromkonto_data.account.nominalCori + " kWh/Jahr";
                } else {
                    stromkonto_data.kwha= "0 kWh/Jahr";
                }
                if(typeof stromkonto_data.account.txs == "undefined") stromkonto_data.account.txs=[];
                var ts=new Date().getTime();
                stromkonto_data.account.txs=stromkonto_data.account.txs.reverse();
                let mygen=0;
                var compact_gen = {};
            
                for(var i=0;i<stromkonto_data.account.txs.length;i++) {
                    stromkonto_data.account.txs[i].cori=stromkonto_data.account.txs[i].cori*1;
                    stromkonto_data.account.txs[i].generation = Math.abs(stromkonto_data.account.txs[i].cori * ((stromkonto_data.account.txs[i].timeStamp-ts)/(31536000000)));
                    if(typeof stromkonto_data.account.txs[i].contract != "undefined") stromkonto_data.account.txs[i].peer=resolvAddress(stromkonto_data.account.txs[i].contract); else stromkonto_data.account.txs[i].peer=resolvAddress(stromkonto_data.account.txs[i].asset);
                    stromkonto_data.account.txs[i].timeStamp=new Date(stromkonto_data.account.txs[i].timeStamp).toLocaleString();       mygen+=stromkonto_data.account.txs[i].generation;  
                    if(typeof compact_gen[stromkonto_data.account.txs[i].peer] == "undefined") 
                        compact_gen[stromkonto_data.account.txs[i].peer]= {generation:0,cori:0};
                    compact_gen[stromkonto_data.account.txs[i].peer].peer = stromkonto_data.account.txs[i].peer;
                    compact_gen[stromkonto_data.account.txs[i].peer].generation += stromkonto_data.account.txs[i].generation;
                    compact_gen[stromkonto_data.account.txs[i].peer].cori += stromkonto_data.account.txs[i].cori;
                    stromkonto_data.account.txs[i].generation=stromkonto_data.account.txs[i].generation.toFixed(5).replace('.',',');
                }                
                stromkonto_data.account.txs_aggregated=compact_gen;
                if(typeof stromkonto_data.account.things == "undefined")  {
                    stromkonto_data.account.things={};
                } else {                    
                    $('#things-card-collapsed').remove();
                }
                for(var i=0;i<stromkonto_data.account.things.length;i++) {
                    if(typeof stromkonto_data.account.things[i].title == "undefined") stromkonto_data.account.things[i].title=stromkonto_data.account.things[i].account;
                    if(typeof stromkonto_data.account.things[i].base_add == "undefined") stromkonto_data.account.things[i].base_add=0;
                    if((typeof stromkonto_data.account.things[i].ap == "undefined")&&(typeof stromkonto_data.account.ap != "undefined")) stromkonto_data.account.things[i].ap=stromkonto_data.account.ap;
                    stromkonto_data.account.things[i].timeStamp="-"; 
                    $.getJSON("https://api.corrently.io/core/iot?account="+stromkonto_data.account.things[i].account,function(data) {
                        for(var j=0;j<stromkonto_data.account.things.length;j++) {
                            if(stromkonto_data.account.things[j].account==data.result.account) {
                                data.result.value+= stromkonto_data.account.things[j].base_add;
                                stromkonto_data.account.things[j].timeStamp = new Date(data.result.timeStamp).toLocaleString();
                                stromkonto_data.account.things[j].base = (data.result.value/1000).toFixed(3).replace('.',',');
                                stromkonto_data.account.things[j].eur = ((data.result.value/1000)*stromkonto_data.account.things[j].ap);
                                if(stromkonto_data.account.things[j].eur>1) {
                                    stromkonto_data.account.things[j].eur=stromkonto_data.account.things[j].eur.toFixed(2).replace('.',',');
                                } else {
                                    stromkonto_data.account.things[j].eur=stromkonto_data.account.things[j].eur.toFixed(5).replace('.',',');
                                }
                                
                            }
                        }                        
                    })
                }                
                stromkonto_data.generation_3f=mygen.toFixed(3).replace('.',',');
                if(stromkonto_data.account.txs.length > 11) {
                    stromkonto_data.account.txs = stromkonto_data.account.txs.slice(0,12);
                    $('#max_asset_rows').show();
                }
                if(typeof stromkonto_data.account.sev == "undefined") {
                    $('#fc_tarif').hide();
                    stromkonto_data.account.sev = {};
                    stromkonto_data.account.sev.t_instalment =0;
                    stromkonto_data.account.sev.m_instalment =0;
                    stromkonto_data.account.sev.c_instalment =0;
                    stromkonto_data.account.sev.ja = "-";
                } else {
                    $('#fc_tarif').show();
                }
                //console.log("MyGen",mygen);
                stromkonto_data.txs = stromkonto_txs;
                if( $('#app').attr("initialized")!="true") initVue();
                if(typeof l.transactions == "function") {                    
                    l.transactions().then(function(mytxs) {   
                        let balance_ongoing=stromkonto_data.balance;                          
                        mytxs = mytxs.slice(0,12);
                        for(var i=0; i<mytxs.length;i++) {
                            mytxs[i].peer_account=mytxs[i].peer;
                            mytxs[i].peer = resolvAddress(mytxs[i].peer);                             
                            if(mytxs[i].from == "0xdcbab2b1c28b6f57c367f4eff0f5c7893400cc4d") {
                                mytxs[i].peer += " (für "+mytxs[i].base_abs+" kWh)";
                            }
                            mytxs[i].timeStamp =  timeStamp(mytxs[i].blockNumber);   
                            balance_ongoing-=(mytxs[i].value*100000);
                        }
                        stromkonto_txs = mytxs;
                        stromkonto_data.txs = mytxs;           
                        $('#start_saldo').html((balance_ongoing/100000).toFixed(5).replace('.',','));
                    });
                }
                if(stromkonto_data.balance<1) {
                    $('#buy_btn').attr('disabled','disabled');
                    $('#wire_btn').attr('disabled','disabled');
                } else {
                    $('#buy_btn').removeAttr('disabled');
                    $('#wire_btn').attr('disabled','disabled');
                }

                $('#app').show();                    
                gsiTable();
                setTimeout(openAccount,60000*2);
                $('#buy_btn').click(function() {
                   $('.corrently-panels').hide(); 
                   $('#market_panel').show();  
                });
                $('#btn_tx').attr('onclick',"javascript:toggle('tx-card','toggle_tx');");
                $('#btn_asset').attr('onclick',"javascript:toggle('asset-card','toggle_asset');");                    
                $('#btn_things').attr('onclick',"javascript:toggle('things-card','toggle_things');");
                $('#btn_tarif').attr('onclick',"javascript:toggle('tarif-card','toggle_tarif');");
                toggle('tx-card','toggle_tx',true);
                toggle('asset-card','toggle_asset',true);
                toggle('things-card','toggle_things',true);
                toggle('tarif-card','toggle_tarif',true);
        });
    });    
    
}

function updateMarket() {
    if((market_data==null)&&(typeof stromkonto_data.balance_eur != "undefined")) {
        setTimeout(function() {
            CorrentlyWallet.default.Market().then(function(market) { 
                market_data=market;                
                let html="";
                for(var i=0;i<market.length;i++){
                    html+="<tr>";
                    html+="<td title='"+market[i].asset+"'>"+market[i].title+"</td>";
                    html+="<td title='"+market[i].contract+"'>"+market[i].emitent+"</td>";      
                    html+="<td>"+market[i].decom+"</td>";
                    let kap=Math.floor((stromkonto_data.balance_eur*100)/(market[i].cori));
                    html+="<td><button class='btn btn-warning btn-sm buytx' enabled='enabled' data='"+market[i].asset+"' data-asset='"+market[i].contract+"' data-kap='"+kap+"' data-cori='"+market[i].cori+"' data-funding='"+Math.round(stromkonto_data.balance_eur*100)+"' data-title='"+market[i].title+"'>"+kap+" kWh/Jahr</button></td>";
                    html+="</tr>";
                }
                $('#market_table').html(html);                
                $('#btn_close_market').click(function() {
                    location.reload(false);
                   //openAccount(); 
                });
                $('#markettx').hide();
                $('.buytx').click(function(e) {                     
                    $('#markettx').show();
                    $('#market_sel_kap').val($(e.currentTarget).attr('data-kap'));
                     //$('#market_sel_kap').val(1);
                    $('#market_sel_cori').val($(e.currentTarget).attr('data-cori'));
                    $('#market_sel_contract').val($(e.currentTarget).attr('data'));
                    $('#market_sel_asset').val($(e.currentTarget).attr('data-asset'));
                    $('#market_sel_title').val($(e.currentTarget).attr('data-title'));
                    $('#market_sel_sko').val(stromkonto_data.account.account);
                    
                    $('#btn_markettx').click(function() {
                        let wallet = new CorrentlyWallet.default.Wallet(CorrentlyWallet.default.utils.id($('#market_name').val()+"@"+$('#market_password').val()),new CorrentlyWallet.default.providers.JsonRpcProvider("https://node.corrently.io/"));
                        $('.corrently-panels').hide();
                        wallet.buyCapacity($('#market_sel_contract').val(),$('#market_sel_kap').val(),stromkonto_data.account.account).then(function(l) {
                            setTimeout(openAccount,8000); 
                        });
                    });
                });
            });
            var found=false;
            if(typeof stromkonto_data.account.aliases != "undefined") {
                for(var i=0;i<stromkonto_data.account.aliases.length;i++) {
                    if(stromkonto_data.account.aliases[i]== window.localStorage.getItem("webview")) found=true;
                }
            }
            if(found) $('#keyAlert').hide(); else $('#keyAlert').show();
        },1000);
    }
}
function switch_ledger() {
       $('.corrently-panels').hide();        
       $('#web_panel').show();               
}
function toggle(element,btn,persisted) {    
    var view=window.localStorage.getItem("view_"+element);       
    if(typeof persisted == "undefined") persisted=false;
    if(!persisted) {
        if((view==null)||(view==false)||(view=="false")) {
            view=true;
        } else view=false;
    }   else {
        view=false;
    } 
    window.localStorage.setItem("view_"+element,view);
    if((view)||(view=="true")) { 
        $('#'+element).show();   
        $('#'+element+"-collapsed").hide();
        $('#'+btn).removeClass('fa-chevron-circle-down');
        $('#'+btn).addClass('fa-chevron-circle-up');
    } else { 
        $('#'+element).hide(); 
        $('#'+element+"-collapsed").show();
        $('#'+btn).removeClass('fa-chevron-circle-up');
        $('#'+btn).addClass('fa-chevron-circle-down');        
    }
}
$(document).ready(function() {
    
    $('.corrently-panels').hide();
    $('#app').hide();
    $('#gsi').hide();
    $('#valigroup').hide();
    $('#account_alias').val("");
    $('#btn_switch_ledger').click(switch_ledger);
   
    $('#reload_link').click(function() {
       location.reload(false); 
    });    
    $('#btn_remove').click(function() {
        window.localStorage.removeItem("alias_"+$('#account_alias').val());
        webview_save();        
    });        
    initBCStatus();
    if($.qparam("a")) {
        $('#account').val($.qparam("a"));
    } else {
        if(window.localStorage.getItem("privateKey")) {
           let lwallet = new CorrentlyWallet.default.Wallet(window.localStorage.getItem("privateKey"));
            console.log("Key from localStorage");
            $('#account').val(lwallet.address);
        } else {            
            if((window.localStorage.getItem("lastAddress"))&&(window.localStorage.getItem("lastAddress").length==42)) {
                console.log("Account from History");
                $('#account').val(window.localStorage.getItem("lastAddress"));
            } else {
                console.log("Key/Account from New");
                let lwallet = CorrentlyWallet.default.Wallet.createRandom();
                $('#account').val(lwallet.address);
            }
        }
    }
    $('#btn_open').click(openAccount);
    $('#btn_webview').click(webview);
    $('#mform').submit(function() { return false; });
    openAccount();    
    osSubscribe();
    $('#btn_change').click(function() {
       $('.corrently-panels').hide();               
       $('#frm_panel').show();  
       let html="";
       let keys = Object.keys(localStorage);
       for(var i=0;i<keys.length;i++) {           
           if(keys[i].substr(0,6)=="alias_") {               
               html+='<a class="dropdown-item" role="presentation" href="/?a='+window.localStorage.getItem(keys[i])+'" >'+keys[i].substr(6)+'</a>';
           }            
       }    

       $('#history').html(html);
    });
    if($.qparam("goto")=="webuser") {
        setTimeout(switch_ledger,2000);
    }     
    if($.qparam("setalias")=="true") {
        setTimeout(function() {
            $('.corrently-panels').hide();               
           $('#frm_panel').show();  
           let html="";
           let keys = Object.keys(localStorage);
           for(var i=0;i<keys.length;i++) {           
               if(keys[i].substr(0,6)=="alias_") {               
                   html+='<a class="dropdown-item" role="presentation" href="/?a='+window.localStorage.getItem(keys[i])+'" >'+keys[i].substr(6)+'</a>';
               }            
           }    

           $('#history').html(html);
        },2000);
    }
});
$('.prod_btn').click(function(e) {    
    $('#prodauswahl').val(e.currentTarget.id);
    location.href="#stammdaten";
});
$('document').ready(function() {
   if(typeof boot == "function") {
       boot();
   }
});

//window.onblur = function() { blurred = true; };
//window.onfocus = function() { blurred && (openAccount()); };