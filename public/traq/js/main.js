// INIT VARIABLES

// canvas
let canvas = document.getElementById('canvas_1');
let ctx = canvas.getContext('2d');

//gaze data
let datos_otro = { x: 0, y: 0 }
let datos_propios = { x: 0, y: 0 }
//for smoothing
let prevData = []
let at = 0
let bufferSize = 8

// distancia al centro
distanceToCenterA = Infinity
distanceToCenterB = Infinity
distanceToCenter = Infinity
distanceToCenterThreshold = 300


// puntos
let color1 = "#000000"
let color2 = "#ff00ff"
let radius = 40;
let distancia = 0;

//sound
let synthGain, sampleGain, synth, sample, filter
let initialGain = 0.2

// radar
let radar = document.querySelector('#radar')
let scaleVal = 1.0
// setInterval(() => {
//   scaleVal -= 0.02
//   radar.style.transform = `translate(-50%,-50%) scale(${scaleVal})`
//   console.log('scale!')
// },1000)


const dist = (p1, p2) => {
    var a = p1.x - p2.x;
    var b = p1.y - p2.y;
    return Math.sqrt(a * a + b * b);
}

const map = (t, in_min, in_max, out_min, out_max) => {
    return (t - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

// DEBUG
const DEBUG = false
let showMirada1 = false
let showMirada2 = true
showPoints = false
let showCam = true
let video = null
const btnToggleMirada1 = document.querySelector("#toggleMirada1")
const btnToggleMirada2 = document.querySelector("#toggleMirada2")
const btnToggleCam = document.querySelector("#toggleCam")
const btnClear = document.querySelector('#buttonClear')

const toggleMirada = num => _ => {
    if (num === 1) {
        showMirada1 = !showMirada1
    } else if (num === 2) {
        showMirada2 = !showMirada2
        if (showMirada2) {
            btnToggleMirada2.innerText = "ocultar mirada 2"
        } else {
            btnToggleMirada2.innerText = "mostrar mirada 2"
        }
    }
}

const toggleCam = _ => {
    if (video) {
        showCam = !showCam
        if (showCam) {
            video.style.transform = "translateX(0px)"
        } else {
            video.style.transform = "translateX(-1000px)"
        }
    }
}

const onResize = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
};

btnToggleMirada1.addEventListener('click', toggleMirada(1))
btnToggleMirada2.addEventListener('click', toggleMirada(2))
btnToggleCam.addEventListener('click', toggleCam)
btnClear.addEventListener('click', onResize)
window.addEventListener('resize', onResize, false);
onResize()


//AUDIO INIT
const startAudioBtn = document.querySelector('#startAudio')
startAudioBtn.addEventListener('click', async () => {
    await Tone.start()
    console.log('audio is ready :)')

    const mainGain = new Tone.Gain().toDestination()

    //sample
    sampleGain = new Tone.Gain(0).connect(mainGain)
    sampleGain.gain.rampTo(0.0, 1)
    sample = new Tone.Player("track.mp3").connect(sampleGain)
    // play as soon as the buffer is loaded
    sample.autostart = true
    sample.loop = true

    startAudioBtn.style.display = "none"

    //synth
    synthGain = new Tone.Gain(0).connect(mainGain);
    synthGain.gain.rampTo(initialGain, 1);
    const verb = new Tone.Freeverb().connect(synthGain)
    verb.roomSize.value = 0.7
    verb.dampening.value = 0.8
    filter = new Tone.AutoFilter(0.05, 60, 1).connect(verb).start()
    synth = new Tone.PWMOscillator(60, 0.3).connect(filter).start()

})


// SOCKET IO
let socket = io()

// MAIN FNS
const setup = () => {
    var inter
    var canvas = document.getElementById("plotting_canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'fixed';
    inter = setInterval(() => {
        video = document.querySelector("#webgazerVideoContainer")
        if (video) {
            clearInterval(inter)
        }
    }, 1000)

    if (!DEBUG) {
        btnToggleMirada1.style.display = "none"
        // btnToggleMirada2.style.display = "none"
        btnToggleCam.style.display = "none"
        btnClear.style.display = "none"
        //inter2 = setInterval(() => {
        //  if(video){
        //    console.log("VIDEO", video)
        //    //video.style.transform= "translateX(-1000px)"
        //    clearInterval(inter2)
        //  }
        //}, 1000)
        showMirada1 = true
        showMirada2 = true
    }
};

// ON GAZE
const onGaze = (data, clock) => {
    if (data != null) {

        prevData[at] = data
        let sum = { x: 0, y: 0 }
        for (let d of prevData) {
            sum.x += d.x
            sum.y += d.y
        }
        at = (at + 1) % bufferSize
        let avg = { x: sum.x / bufferSize, y: sum.y / bufferSize }
        // data.x = Math.abs(data.x - prevData.x)
        // data.y = Math.abs(data.y - prevData.y)
        data = avg
        //console.log('avg', avg)
        datos_propios = data;
        const d = dist(datos_propios, datos_otro)
        distanceToCenterA = dist(datos_propios, { x: window.innerWidth / 2, y: window.innerHeight / 2 })
        distanceToCenter = (distanceToCenterA + distanceToCenterB) / 2

        const hue = Math.floor(Math.abs(map(d, 0, window.innerWidth, 0, 360)))
        if (showMirada1 && showPoints) {
            ctx.globalAlpha = 0.07
            ctx.fillStyle = "rgb(255,255,255)";
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.globalAlpha = 1.0
            ctx.fillStyle = `hsl(${hue},100%, 20%)`;
            ctx.beginPath();
            ctx.moveTo(datos_propios.x + radius, datos_propios.y);
            ctx.arc(datos_propios.x, datos_propios.y, radius, 0, 2 * Math.PI);
            ctx.fill()
        }

        socket.emit("gaze", { x: data.x, y: data.y })
    }

}

// ON LOAD
window.onload = async () => {
    webgazer.params.showVideoPreview = false;
    //start the webgazer tracker
    await webgazer.setRegression('ridge')
        .setGazeListener(onGaze)
        .saveDataAcrossSessions(true)
        .begin();
    webgazer.showVideoPreview(true)
        .showPredictionPoints(true)
        .applyKalmanFilter(true);
    setup();

};


socket.on("o_gaze", (g) => {
  datos_otro = g
  // calculo la distancia y la mapeo a un rango
  distancia = dist(datos_propios, datos_otro)
  distanceToCenterB = dist(datos_otro, { x: window.innerWidth / 2, y: window.innerHeight / 2 })
  distanceToCenter = (distanceToCenterA + distanceToCenterB) / 2
  // console.log('center', distanceToCenter)

  radius = parseFloat(Math.abs(map(distancia, 0, window.innerWidth, 20, 0.5))).toFixed(2)

  if (synth) {
    synth.modulationFrequency.rampTo(map(distancia, 0, window.innerWidth, 0, 1), 2)
    synthGain.gain.rampTo(map(distancia, 0, window.innerWidth, 0.0, 0.6), 1)
  }

  if (sample) {
    if (distanceToCenterA < distanceToCenterThreshold && 
      distanceToCenterB < distanceToCenterThreshold) {
      let d = map(distanceToCenter, 0, (window.innerWidth + window.innerHeight) / 2, 1.0, 0.0)
      if(scaleVal > 0.001){
        scaleVal -= 0.002
        radar.style.transform = `translate(-50%,-50%) scale(${scaleVal})`
      }
      console.log('D', d)
      sampleGain.gain.rampTo(d, 0.1)
      distanceToCenterThreshold -= 0.002 
    } else {
      sampleGain.gain.rampTo(0.0, 1)
      if(scaleVal < 1.0){
        scaleVal += 0.002
        radar.style.transform = `translate(-50%,-50%) scale(${scaleVal})`
      }
    }

  }

  if (showMirada2 && showPoints) {
    ctx.fillStyle = color1;
    ctx.beginPath();
    ctx.moveTo(datos_otro.x + radius, datos_otro.y);
    ctx.arc(datos_otro.x, datos_otro.y, radius, 0, 2 * Math.PI);
    ctx.fill();
  }

})



// Set to true if you want to save the data even if you reload the page.
window.saveDataAcrossSessions = true;
window.onbeforeunload = function() {
    webgazer.end();
}

function Restart() {
    document.getElementById("Accuracy").innerHTML = "<a>Not yet Calibrated</a>";
    webgazer.clearData();
    ClearCalibration();
    PopUpInstruction();
}

