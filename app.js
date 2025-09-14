console.log('Página cargada:', Date.now());

const questionSection = document.getElementById('question-section');
const resultsSection  = document.getElementById('results-section');

//detectar ubicación
const path = window.location.pathname;
const isCamaraPage = path.includes('camara');
const isSenadoPage = path.includes('senado');
const voteType = isCamaraPage
  ? 'camara'
  : isSenadoPage
    ? 'senado'
    : 'presidencia';
console.log(voteType);

// verificación de votos
const voteData = JSON.parse(localStorage.getItem('voteData')) || {};
const voteDataC = JSON.parse(localStorage.getItem('voteDataC')) || {};
const voteDataS= JSON.parse(localStorage.getItem('voteDataS')) || {};
const today = new Date().toISOString().slice(0, 10);

switch(voteType){
  case 'presidencia':
    if(voteData.date !== today)
    {
        localStorage.removeItem('voteData'); // limpieza diaría
    }
    
    if (voteData.date === today && voteData.count >= 3) {
      questionSection.classList.add('hide');
      resultsSection.classList.remove('hide');
    } else {
      questionSection.classList.remove('hide');
      resultsSection.classList.add('hide');
    }
    break;
  case 'camara':
    if(voteDataC.date !== today)
    {
        localStorage.removeItem('voteDataC');
    }
    
    if (voteDataC.date === today && voteDataC.count >= 3) {
      questionSection.classList.add('hide');
      resultsSection.classList.remove('hide');
    } else {
      questionSection.classList.remove('hide');
      resultsSection.classList.add('hide');
    }
    break;
  case 'senado':
    if(voteDataS.date !== today)
    {
        localStorage.removeItem('voteDataS');
    };
    
    if (voteDataS.date === today && voteDataS.count >= 3) {
      questionSection.classList.add('hide');
      resultsSection.classList.remove('hide');
    } else {
      questionSection.classList.remove('hide');
      resultsSection.classList.add('hide');
    }
    break;
}

// 1. DOMContentLoaded: espera a que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  const chart    = initChart();                             // crea la instancia
  const selector = document.getElementById('periodSelector');

  // Carga inicial: usa el valor por defecto del <select>
  updateChart(chart, selector.value);

  // Cuando el usuario cambie el periodo, refresca la gráfica
  selector.addEventListener('change', () => {
    updateChart(chart, selector.value);
  });

  // tras votar, recarga con el periodo actual
  setupVotingButtons(chart, () => {
    updateChart(chart, selector.value);
  });
});


// 2. desactivar maintainAspectRatio para CSS
function initChart() {
  const ctx = document.getElementById('resultsChart').getContext('2d');
  return new Chart(ctx, {
    type: 'bar',
    data: { labels: [], datasets: [{ label:'Total de apoyo', data:[], backgroundColor:'rgba(54,162,235,0.5)', borderColor:'rgba(54,162,235,1)', borderWidth:1 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } }
    }
  });
}

// 3. petición única a /results y actualizar la gráfica

const resultsEndpoint = isCamaraPage
  ? 'https://api.encuestapactohistorico.com/results/camara'
  : isSenadoPage
    ? 'https://api.encuestapactohistorico.com/results/senado'
    : 'https://api.encuestapactohistorico.com/results';

async function updateChart(chart, period) {
  try {
    const url = `${resultsEndpoint}?period=${period}`;
    const res  = await fetch(url);
    if (!res.ok) throw new Error(res.statusText);

    const { labels, votes, total } = await res.json();
    animateTotalVotes(total);
    chart.data.labels           = labels;
    chart.data.datasets[0].data = votes;
    chart.update();
    document.getElementById('totalVotesDisplay').textContent = `Participación total: ${total}`;
  } catch (err) {
    console.error(err);
    alert('No se pudieron cargar los resultados. Revisa la consola.');
  }
}

// 4. Recibe un callback para recargar la gráfica
function setupVotingButtons(chart, onVotedCallback) {
  const buttons  = document.querySelectorAll('.avatar-container button');

  buttons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const candidateId = btn.dataset.id;

      // Guardar estado de votación
      const voteData = JSON.parse(localStorage.getItem('voteData')) || {};
      const voteDataC = JSON.parse(localStorage.getItem('voteDataC')) || {};
      const voteDataS= JSON.parse(localStorage.getItem('voteDataS')) || {};
      const today = new Date().toISOString().slice(0, 10);
      const numBase = 3;
      var voteRest = 0;

      switch (voteType){
        case 'presidencia':
          if (voteData.date !== today) {
            voteData.date = today;
            voteData.count = 0;
            voteData.type = voteType;
          }

          if(voteData.count <3)
          {
            voteData.count += 1;
            localStorage.setItem('voteData', JSON.stringify(voteData));
            questionSection.classList.add('hide');
            resultsSection.classList.remove('hide');
            voteRest =(numBase - voteData.count);
            console.log(voteRest);
            alert(`Cantidad de votos diarios restantes: ${voteRest}`);
          }
          break;
        case 'camara':
          if (voteDataC.date !== today) {
            voteDataC.date = today;
            voteDataC.count = 0;
            voteDataC.type = voteType;
          };

          if(voteDataC.count <3){
            voteDataC.count += 1;
            localStorage.setItem('voteDataC', JSON.stringify(voteDataC));
            questionSection.classList.add('hide');
            resultsSection.classList.remove('hide');
            voteRest =(numBase - voteDataC.count);
            console.log(voteRest);
            alert(`Cantidad de votos diarios restantes: ${voteRest}`);
          }
          break;
        case 'senado':
          if (voteDataS.date !== today) {
            voteDataS.date = today;
            voteDataS.count = 0;
            voteDataS.type = voteType;
          };

          if(voteDataS.count <3){
            voteDataS.count += 1;
            localStorage.setItem('voteDataS', JSON.stringify(voteDataS));
            questionSection.classList.add('hide');
            resultsSection.classList.remove('hide');
            voteRest =(numBase - voteDataS.count);
            console.log(voteRest);
            alert(`Cantidad de votos diarios restantes: ${voteRest}`);
          }
          break;
      }
      // if(voteData.count <3)
      // {
      //   voteData.count += 1;
      //   localStorage.setItem('voteData', JSON.stringify(voteData));
      //   questionSection.classList.add('hide');
      //   resultsSection.classList.remove('hide');
      //   voteRest =(numBase - voteData.count);
      //   console.log(voteRest);
      //   alert(`Cantidad de votos diarios restantes: ${voteRest}`);
      // }

      const voteEndpoint = isCamaraPage
      ? 'https://api.encuestapactohistorico.com/vote/camara'
      : isSenadoPage
      ? 'https://api.encuestapactohistorico.com/vote/senado'
      : 'https://api.encuestapactohistorico.com/vote';

      const res = await fetch(voteEndpoint, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ candidateId })
      });
      
        const { success, message } = await res.json();
      try {

        if (!success) {
          alert(message);
          return;
        }
        
      function disableButtons(buttons) {
        buttons.forEach(btn => {
        btn.disabled = true;
        btn.classList.add('disabled');
      });
      }

        // tras insertar en el servidor, refresca la gráfica
        onVotedCallback();

      } catch (err) {
        console.error(err);
        alert('Error al registrar tu voto.');
      }
    });
  });
}

// 5. Animar el conteo total de votos
function animateTotalVotes(targetValue) {
  const display = document.getElementById('totalVotesDisplay');
  let current = 0;
  const duration = 1000; // duración total en ms
  const stepTime = Math.max(Math.floor(duration / targetValue), 20);

  const timer = setInterval(() => {
    current += 1;
    display.textContent = `Total de apoyos: ${current}`;
    if (current >= targetValue) clearInterval(timer);
  }, stepTime);
}

// 6. Abrir Popup
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const shareBtn = document.getElementById('share-button');
const popup = document.getElementById('share-popup');

// Modo móvil con Web Share API
if (isMobile && navigator.share) {
  shareBtn.addEventListener('click', () => {
    
    switch (voteType){
      case 'presidencia':
        navigator.share({
        title: 'Encuesta Pacto Histórico',
        text: 'Encuesta candidato presidencial',
        url: 'https://www.encuestapactohistorico.com'
      }).catch((err) => {
        console.error('Error al compartir:', err);
      })
      break;
      case 'camara':
        navigator.share({
        title: 'Encuesta Pacto Histórico',
        text: 'Candidatos Cámara de representantes',
        url: 'https://www.encuestapactohistorico.com/camara.html'
      }).catch((err) => {
        console.error('Error al compartir:', err);
      })
      break;
      case 'senado':
        navigator.share({
        title: 'Encuesta Pacto Histórico',
        text: 'Candidatos para Senado',
        url: 'https://www.encuestapactohistorico.com/senado.html'
      }).catch((err) => {
        console.error('Error al compartir:', err);
      })
      break;
    }
    // navigator.share({
    //   title: 'Encuesta Pacto Histórico',
    //   text: 'Participa en esta encuesta',
    //   url: 'https://www.encuestapactohistorico.com'
    // }).catch((err) => {
    //   console.error('Error al compartir:', err);
    // });
  });

  if (popup) {
    popup.style.display = 'none';
  }
}else {
  shareBtn.addEventListener('click', () => {
    popup.classList.toggle('hidden-btn');
  });

  document.addEventListener('click', (e) => {
    if (!shareBtn.contains(e.target) && !popup.contains(e.target)) {
      popup.classList.add('hidden-btn');
    }
  });
}

