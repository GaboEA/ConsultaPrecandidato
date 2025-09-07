console.log('Página cargada:', Date.now());

const questionSection = document.getElementById('question-section');
const resultsSection  = document.getElementById('results-section');

// Verifica si el usuario ya votó
const today = new Date().toISOString().slice(0, 10);
const lastVoteDate = localStorage.getItem('lastVoteDate');

if (lastVoteDate === today) {
  questionSection.classList.add('hide');
  resultsSection.classList.remove('hide');
} else {
  localStorage.removeItem('lastVoteDate'); // limpia si es de otro día
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

      // Ejecutar reCAPTCHA antes de enviar el voto
      grecaptcha.ready(function() {
        grecaptcha.execute('6LclgMErAAAAAL3y1xPVVTZMeHxjuES7LU5c2992', { action: 'votar' }).then(async function(token) {
          try {
            // Guarda el estado de votación
            localStorage.setItem('lastVoteDate', new Date().toISOString().slice(0, 10));

            // Oculta sección y muestra resultados
            questionSection.classList.add('hide');
            resultsSection.classList.remove('hide');

            const res = await fetch('https://api.encuestapactohistorico.com/vote', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ candidateId, recaptchaToken: token })
            });

            const { success, message } = await res.json();

            if (!success) {
              alert(message || 'Error en la verificación reCAPTCHA');
              return;
            }

            buttons.forEach(b => {
              b.disabled = true;
              b.classList.add('disabled');
            });

            // Refrescar gráfica
            onVotedCallback();

          } catch (err) {
            console.error(err);
            alert('Error al registrar tu voto.');
          }
        });
      });
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
    display.textContent = `Total Participantes: ${current}`;
    if (current >= targetValue) clearInterval(timer);
  }, stepTime);
}

