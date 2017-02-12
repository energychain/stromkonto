/************
StromDAO - Stromkonto
------------------------------------------------------------------------------
Das Stromkonto ist ein auf die Ethereum-Blockchain basierendes Energiekonto
für Stromkunden. Dieser Beispielcode zeigt die generelle Verwendung und 
Einbindung in andere Webprojekte.
 
Autor: Thorsten Zoerner <thorsten.zoerner@stromdao.de>
https://stromdao.de/stromkonto 
 ************/
stromkonto = {};
stromkonto.ui={};

function getQueryParams(qs) {
    qs = qs.split("+").join(" ");
    var params = {},
        tokens,
        re = /[?&]?([^=]+)=([^&]*)/g;

    while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])]
            = decodeURIComponent(tokens[2]);
    }

    return params;
}

var $_GET = getQueryParams(document.location.search);

function renameAdr(adr) {
   var n=prompt("Neuer Namen für "+adr);
   window.localStorage.setItem("dao.adr."+adr,n);
}
function getAdr(adr) {
  if(window.localStorage.getItem("dao.adr."+adr)!=null) {
    return window.localStorage.getItem("dao.adr."+adr);
  } else return adr;
}

 
stromkonto.ui.showKontonummer=function (el) {
	$(el).html(dao.address);
} 
 
stromkonto.ui.showBalance=function(el_soll,el_haben,el_saldo) {
	dao.obj.balancer.balanceSoll( dao.address).then(function(n) {
			var forderungen=n.toString()+0;
			$(el_soll).html(convertToEur(forderungen).format(2,0,'.',','));
			dao.obj.balancer.balanceHaben(dao.address).then(function(n) {
			  var gutschriften=n.toString()+0;
			  $(el_haben).html(convertToEur(gutschriften).format(2,0,'.',','));
			  var saldo=gutschriften-forderungen;
			  dao.saldo=saldo;
			  if(saldo<0) $(el_saldo).css('color','red');
			  
			  $(el_saldo).html(convertToEur(saldo).format(2,0,'.',','));			   
			});
	});     		
}

stromkonto.ui.showLastTXTable=function(el,r) {
 $.getJSON("https://app.stromdao.de/blockchain/?a="+dao.address+"&o="+r*1,function(o) {
      var html="";        
        dao.verlauf=[];
        //var data=[];
        var saldo=0;
        
        
      
      for(var i=0;i<o.length;i++) {
        r++;
        html+="<tr>";
        var d=new Date(o[i].ts);
        html+="<td>"+d.toLocaleString()+"</td>";  
        
        var t=o[i].desc;
        var amount = o[i].amount/100;
        amount=Math.abs(amount);
        t+="<a href='#' onclick='$(\"#more"+o[i].tx_hash+"\").toggle();return false;'>...</a><span id='more"+o[i].tx_hash+"' style='display:none'><br/>";
        t+="Transaktion: <a href='https://etherscan.io/tx/"+o[i].tx_hash+"' target=_blank>#"+o[i].tx_hash.substring(0,12)+"...</a><br/>";
        if(o[i].to!=dao.address) { amount*=-1; t+=" an: <a href='?a="+o[i].to+"'>@"+getAdr(o[i].to).substring(0,12)+"...</a>"; } else { t+=" von: <a href='?a="+o[i].from+"'>@"+getAdr(o[i].from).substring(0,12)+"...</a>"}
        t+="<br/>";
        if(o[i].payload) {
           t+="<table border=1>";
          o[i].payload=JSON.parse(o[i].payload);
          
          if(o[i].payload.duration) {
            t+="<tr><th>Sekunden</th><td align='right'>"+o[i].payload.duration+"</td></tr>";
          }
          if(o[i].payload.wh) {
            t+="<tr><th>Wattstunden</th><td align='right'>"+Math.round(o[i].payload.wh)+"</td></tr>";
          }
         
          
          if(o[i].payload.Brutto>0)  { 
            t+="<tr><th>Brutto</th><td align='right'>"+(o[i].payload.Brutto/100).format(2,0,'.',',')+"€</td></tr>";
            t+="<tr><th>UST 19%</th><td align='right'>"+(o[i].payload.Ust19/100).format(2,0,'.',',')+"€</td></tr>";
            t+="<tr><th>Netto</th><td align='right'>"+(o[i].payload.Netto/100).format(2,0,'.',',')+"€</td></tr>";
            t+="<tr><th>Stromsteuer</th><td align='right'>"+o[i].payload.Stromsteuer.format(2,0,'.',',')+"€</td></tr>";
            t+="<tr><th>EEG‐Umlage</th><td align='right'>"+o[i].payload.EEG2017.format(2,0,'.',',')+"€</td></tr>";
            t+="<tr><th>Aufschlag KWK‐G</th><td align='right'>"+o[i].payload.KWKG.format(2,0,'.',',')+"€</td></tr>";
            t+="<tr><th>§ 17 f Abs. 5 EnWG</th><td align='right'>"+o[i].payload.OffshoreHaftung.format(2,0,'.',',')+"€</td></tr>";
            t+="<tr><th>§ 19 Abs. 2 StromNEV</th><td align='right'>"+o[i].payload.StromNEV.format(2,0,'.',',')+"€</td></tr>";
          }
          if(o[i].payload.gruenstromjetons) {
            t+="<tr><th>Grünstrom</th><td align='right'>"+(o[i].payload.gruenstromjetons)+" Jetons</td></tr>";
          }
          if(o[i].payload.graunstromjetons) {
              t+="<tr><th>Graustrom</th><td align='right'>"+(o[i].payload.graunstromjetons)+" Jetons</td></tr>";
          }
          
          t+="</table>";
        }
         
          //saldo+=(o[i].amount)*(-1);
          dao.verlauf[dao.verlauf.length]={a:new Date(o[i].ts),b:amount};
         
        t+="</span>";
        html+="<td>"+t+"</td>";
        html+="<td style='text-align:right'>";
        if(amount<0) html+="<span style='color:red'>";
        html+=amount.format(2,0,'.',',');
        html+=" €";
        if(amount<0) html+="</span>";
        html+="</td>";
        html+="</tr>";
      }
      dao.offsettx=dao.offsettx*1;
      if(o.length>29) {
        html+="<tr onclick='stromkonto.ui.showLastTXTable(\""+el+"\","+(r*1)+");dao.offsettx=1;$(this).hide();'><th colspan=3>Mehr...</th></tr>";
      }
      if(dao.offsettx>0) {
         $(el).html($(el).html()+html);
      } else {
        $(el).html(html);
      }

      //$('#rsslink').attr("href","https://app.stromdao.de/rss/kto/"+dao.address+".xml");
    });
}