console.log('Página cargada:', Date.now());

const questionSection = document.getElementById('question-section');
const resultsSection  = document.getElementById('results-section');

// verificación de votos
const voteData = JSON.parse(localStorage.getItem('voteData')) || {};
const today = new Date().toISOString().slice(0, 10);

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
async function updateChart(chart, period) {
  try {
    const url = `https://api.encuestapactohistorico.com/results?period=${period}`;

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
      const today = new Date().toISOString().slice(0, 10);
      const numBase = 3;
      var voteRest = 0;

      if (voteData.date !== today) {
        voteData.date = today;
        voteData.count = 0;
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

        const res  = await fetch('https://api.encuestapactohistorico.com/vote', {
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

