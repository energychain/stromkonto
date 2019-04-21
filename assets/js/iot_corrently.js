const drawGSI = function(el) {
    var ctx = $(el);
    if(ctx.attr("data-account") == null) {
      ctx.attr("data-account","0xf05e3cA8006245a218186807cF9a38b76bB7ed54");
    }
    if(ctx.attr("data-resolution") == null) {
      ctx.attr("data-resolution","3600000");
    }
    if(ctx.attr("data-from") == null) {
      ctx.attr("data-from","-86400000");
    }
    if(ctx.attr("data-chart") == null) {
      ctx.attr("data-chart","line");
    }
    let add_query = "";
    if(ctx.attr("data-from") != null) {
      if(ctx.attr("data-from")*1>new Date().getTime()) {
          ctx.attr("data-from","-86400000");
      }

      if(ctx.attr("data-from")*1 < 0) {
        add_query += "&from="+(new Date().getTime()+((1*ctx.attr("data-from"))-(1*ctx.attr("data-resolution"))));
      } else {

        add_query += "&from="+ctx.attr("data-from");
      }
    }
    if(ctx.attr("data-to") != null) {
      add_query += "&to="+ctx.attr("data-to");
    }    
    $.getJSON("https://api.corrently.io/core/reading?account="+ctx.attr('data-account')+"&history="+ctx.attr('data-resolution')+add_query,function(data) {
        let data_1_8_0 = [];
        let data_9_99_0 = [];
        for(var i=1;i<data.history.length;i++) {
          if((data.history[i]["1.8.0"]!=null)&&(data.history[i]["1.8.0"]-data.history[i-1]["1.8.0"]>0)) {
            data_1_8_0.push({
              y:(((data.history[i]["1.8.0"]-data.history[i-1]["1.8.0"])/10000)/((data.history[i].timeStamp-data.history[i-1].timeStamp)/3600)),
              x:data.history[i].timeStamp
            })
          }
          if(data.history[i]["9.99.0"] != null) {
            data_9_99_0.push( {
              y:data.history[i]["9.99.0"],
              x:data.history[i].timeStamp
            });
          }
        }

        ctx.attr("data-to",data_1_8_0[data_1_8_0.length-1].x);
        ctx.attr("data-from",data_1_8_0[0].x);
        let ts = new Date(ctx.attr("data-to")*1);
        let title = 'bis '+ts.getDate()+"."+(ts.getMonth()+1)+"."+(ts.getYear()+1900);
        ts = new Date(ctx.attr("data-from")*1);
        let long_title = 'von '+ts.getDate()+"."+(ts.getMonth()+1)+"."+(ts.getYear()+1900)+' '+title;
        let ctype = ctx.attr("data-chart");
        let l1 = Math.round(Math.abs(data.history[data.history.length-1]["1.8.1"]-data.history[0]["1.8.1"])/10000000);
        let totalConsumption = Math.round(Math.abs(data.history[data.history.length-1]["1.8.0"]-data.history[0]["1.8.0"])/10000000);
        let l2 = Math.round(Math.abs(data.history[data.history.length-1]["1.8.2"]-data.history[0]["1.8.2"])/10000000);
        let green = Math.round((l1/(l1+l2))*100);
        let grey = 100-green;
        let donut_data = [
          green,
          grey,
        ];
        // Render in html Elements
        $('.usageKwh').filter('[data-account="'+ctx.attr('data-account')+'"]').html((totalConsumption/1000).toFixed(3).replace('.',','));
        $('.greenKwh').filter('[data-account="'+ctx.attr('data-account')+'"]').html((l1/1000).toFixed(3).replace('.',','));
        $('.greyKwh').filter('[data-account="'+ctx.attr('data-account')+'"]').html((l2/1000).toFixed(3).replace('.',','));
        console.log(l1,l2);
        if((ctype=="line")||(ctype=='bar')) {
          let myChart = new Chart(ctx, {
              type: ctype,
              data: {
                datasets: [{
                    type:ctype,
                    label: 'Verbrauch',
                    data: data_1_8_0,
                    borderColor: '#ff0000',
  				          backgroundColor:'#ff0000',
                    fill: false,
                    yAxisID: 'y-axis-1'
                },
                {
                    type:ctype,
                    label: 'GrünstromIndex',
                    data: data_9_99_0,
                    borderColor: '#5cb85c',
                    backgroundColor: '#5cb85c',
                    fill: false,
                    yAxisID: 'y-axis-2'
                }
              ]
              },
              options: {
                  title: {
                    display:true,
                    text:title
                  },
                  legend: { position:"bottom" },
                  scales: {
                    xAxes: [{
                        type: 'time',
                        distribution: 'linear'
                    }],
                    yAxes: [{
                          ticks: {
                              beginAtZero: false
                          },
                          display: true,
  							          position: 'left',
                          id: 'y-axis-1',
                          scaleLabel: {
                            display:true,
                            labelString:'Wh'
                          }
                      },{
                            ticks: {
                                beginAtZero: false
                            },
                            display: true,
  							            position: 'right',
                            id: 'y-axis-2',
                            scaleLabel: {
                              display:true,
                              labelString:'Punkte'
                            }
                        }]
                  }
              }
          });
        }
        if(ctype=="donut") {
          let myChart = new Chart(ctx, {
              type: 'doughnut',
              data: {
                datasets: [{
                    label: 'Verbrauch',
                    data: donut_data,
                    backgroundColor: [
                      '#5cb85c',
                      '#a0a0a0'
                    ]
                }],
                labels: [
        					'Grünstrom',
        					'Graustrom'
				        ]
              },
              options: {
                responsive: true,
                legend: {
                  position: 'bottom',
                },
                title: {
                  display: true,
                  text: long_title
                },
                animation: {
                  animateScale: true,
                  animateRotate: true
                }
              }
          });
        }

        setInterval(function() { drawGSI(el); },Math.round(ctx.attr("data-resolution")/2));
    });
}