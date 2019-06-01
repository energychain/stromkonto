$(document).ready( function() {
  if($.getUrlVar("a") != null) {
     let a=$.getUrlVar("a");
     $('.usageKwh').attr("data-account",a);
     $('.greenKwh').attr("data-account",a);
     $('.greyKwh').attr("data-account",a);
     $('.totalReading').attr("data-account",a);
     $('.greenReading').attr("data-account",a);
     $('.greyReading').attr("data-account",a);
     $('.timeReading').attr("data-account",a);
     $.getJSON("https://api.corrently.io/core/commissioning?account="+a, function(data) {
        for(let i=0;i<data.length;i++) {
          if(data[i].product=="0x59E45255CC3F33e912A0f2D7Cc36Faf4B09e7e22") {
            window.ce_meter = data[i].delivery;
          };
          if(data[i].product=="0x8dd8eddF4f8133f468867c551C17ad7324B411C6") {
            window.ce_sko = data[i].quitance;
          };
          if((typeof data[i].location != "undefined")&&(data[i].location.length == 5)) {
              window.ce_zip = data[i].location;
          }
        }
        if(typeof window.ce_sko != "undefined") {
            $('#stromkonto_overview').correntlySKOBalance(window.ce_sko);
            $('#deport_overview').correntlySKODepot(window.ce_sko);
        }
        if(typeof window.ce_meter != "undefined") {
            $('#usageChart').correntlyReadingChart(window.ce_meter);
            $('#donutChart').correntlyReadingChart(window.ce_meter);
            $('#lastReadingTable').correntlyReadingTable(window.ce_meter);
        } else {
            $('#has_meter').hide();
            $('#no_meter').show();
        }
        if(typeof window.ce_zip != "undefined") {
            $('#gsi_vorhersage').correntlyGSI(window.ce_zip);
        } else {
            $('#gsi_vorhersage').correntlyGSI();
            console.log("Requires Location Info!");
        }
        $('#market').correntlyMarket();
     });    
  } else {
      location.href = "?a=0x69aa1d252Cbb992Fc3fbBED4ddb71840c225dC72";
  }
});