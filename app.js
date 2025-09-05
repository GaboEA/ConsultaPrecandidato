console.log('Página cargada:', Date.now());

const questionSection = document.getElementById('question-section');
const resultsSection  = document.getElementById('results-section');

// Verifica si el usuario ya votó
if (localStorage.getItem('hasVoted') === 'true') {
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
    data: { labels: [], datasets: [{ label:'Votos', data:[], backgroundColor:'rgba(54,162,235,0.5)', borderColor:'rgba(54,162,235,1)', borderWidth:1 }] },
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
    const url = `http://localhost:3000/results?period=${period}`;
    // console.log('[updateChart] Fetching', url);

    const res  = await fetch(url);
    if (!res.ok) throw new Error(res.statusText);

    const { labels, votes } = await res.json();
    // console.log('[updateChart] Data', labels, votes);

    chart.data.labels           = labels;
    chart.data.datasets[0].data = votes;
    chart.update();

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

      // Guarda el estado de votación
        localStorage.setItem('hasVoted', 'true');

      // Oculta la sección de preguntas y muestra resultados
      questionSection.classList.add('hide');
      resultsSection.classList.remove('hide');

        const res  = await fetch('http://localhost:3000/vote', {
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
        
        disableButtons(buttons);

        // tras insertar en el servidor, refresca la gráfica
        onVotedCallback();

      } catch (err) {
        console.error(err);
        alert('Error al registrar tu voto.');
      }
    });
  });
}
