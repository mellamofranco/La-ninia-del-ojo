var PointCalibrate = 0;
var CalibrationPoints={};

/**
 * Clear the canvas and the calibration button.
 */
function ClearCanvas(){
  $(".Calibration").hide();
  var canvas = document.getElementById("plotting_canvas");
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * Show the instruction of using calibration at the start up screen.
 */
function PopUpInstruction(){
  ClearCanvas();
  swal({
    title:"Calibración",
    text:"Por favor, clickeá en cada uno de los 9 puntos en la pantalla. Tenés que seguir con tu mirada el cursor del mouse y clickear cada punto 5 veces hasta que se vuelva amarillo. Esto calibrará tus movimientos oculares",
    buttons:{
      cancel: false,
      confirm: true
    }
  }).then(isConfirm => {
    ShowCalibrationPoint();
  });

}
/**
 * Show the help instructions right at the start.
 */
function helpModalShow() {
  $('#helpModal').modal('show');
}

/**
 * Load this function when the index page starts.
 * This function listens for button clicks on the html page
 * checks that all buttons have been clicked 5 times each, and then goes on to measuring the precision
 */

$(document).ready(function(){
  ClearCanvas();
  helpModalShow();
  $("#closeBtn").click(function(){
    showPoints = true
    document.querySelector("#buttonFin").style.display = "block"
    document.querySelector("#radar").style.display = "block"
  })
  $(".Calibration").click(function(){ // click event on the calibration buttons

    var id = $(this).attr('id');
    if (!CalibrationPoints[id]){ // initialises if not done
      CalibrationPoints[id]=0;
    }
    CalibrationPoints[id]++; // increments values

    if (CalibrationPoints[id]==5){ //only turn to yellow after 5 clicks
      $(this).css('background-color','yellow');
      $(this).prop('disabled', true); //disables the button
      PointCalibrate++;
    }else if (CalibrationPoints[id]<5){
      //Gradually increase the opacity of calibration points when click to give some indication to user.
      var opacity = 0.2*CalibrationPoints[id]+0.2;
      $(this).css('opacity',opacity);
    }

    //Show the middle calibration point after all other points have been clicked.
    if (PointCalibrate == 8){
      $("#Pt5").show();
    }

    if (PointCalibrate >= 9){ // last point is calibrated
      //using jquery to grab every element in Calibration class and hide them except the middle point.
      $(".Calibration").hide();
      $("#Pt5").show();

      // clears the canvas
      var canvas = document.getElementById("plotting_canvas");
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

      // notification for the measurement process
      swal({
        title: "Calculando medición...",
        text: "Por favor no muevas tus ojos y mira fijo al punto del medio durante los próximos 5 segundos. Esto nos permitirá calcular la precisión de nuestras predicciones",
        closeOnEsc: false,
        allowOutsideClick: false,
        closeModal: true
      }).then( isConfirm => {

        // makes the variables true for 5 seconds & plots the points
        $(document).ready(function(){

          store_points_variable(); // start storing the prediction points

          sleep(5000).then(() => {
            stop_storing_points_variable(); // stop storing the prediction points
            var past50 = webgazer.getStoredPoints(); // retrieve the stored points
            var precision_measurement = calculatePrecision(past50);
            var accuracyLabel = "<a>Accuracy | "+precision_measurement+"%</a>";
            document.getElementById("Accuracy").innerHTML = accuracyLabel; // Show the accuracy in the nav bar.
            swal({
              title: "Tu medida de precisión es " + precision_measurement + "%",
              allowOutsideClick: false,
              buttons: {
                cancel: "Recalibrar",
                confirm: true,
              }
            }).then(isConfirm => {
              if (isConfirm){
                //clear the calibration & hide the last middle button
                ClearCanvas();
                document.querySelector("#buttonFin").style.display = "block"
                document.querySelector("#radar").style.display = "block"
                showPoints = true
              } else {
                //use restart function to restart the calibration
                document.getElementById("Accuracy").innerHTML = "<a>Aún sin calibrar</a>";
                webgazer.clearData();
                ClearCalibration();
                ClearCanvas();
                ShowCalibrationPoint();
              }
            });
          });
        });
      });
    }
  });
});

/**
 * Show the Calibration Points
 */
function ShowCalibrationPoint() {
  $(".Calibration").show();
  $("#Pt5").hide(); // initially hides the middle button
}

/**
 * This function clears the calibration buttons memory
 */
function ClearCalibration(){
  // Clear data from WebGazer

  $(".Calibration").css('background-color','red');
  $(".Calibration").css('opacity',0.2);
  $(".Calibration").prop('disabled',false);

  CalibrationPoints = {};
  PointCalibrate = 0;
}

// sleep function because java doesn't have one, sourced from http://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}
