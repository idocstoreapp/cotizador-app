/**
 * Landing Page para Mueblería Casa Blanca
 * Diseño moderno con animaciones y contenido real
 */
import { useState, useEffect } from 'react';

export default function LandingPage({ onShowAuth }: { onShowAuth: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 4);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* HERO */}
      <section className={`relative min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-gray-50 transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/imagenes/cocina-hero.jpg')] bg-cover bg-center opacity-20"></div>
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 animate-fade-in">
            Muebles Personalizados que Diseñan tu Espacio
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed animate-slide-up">
            Conectamos diseño y funcionalidad para crear cocinas, clósets y muebles personalizados que reflejan tu estilo y elevan tus espacios. 
            Nuestro equipo experto asegura resultados impecables, con materiales de primera y cumplimiento exacto de los plazos.
          </p>
          
          {/* Carrusel de imágenes de áreas */}
          <div className="relative max-w-4xl mx-auto mb-8">
            <div className="grid grid-cols-4 gap-4">
              {['cocina', 'closet', 'recibidor', 'sala'].map((area, idx) => (
                <div
                  key={area}
                  className={`relative h-48 rounded-lg overflow-hidden shadow-lg transition-all duration-500 ${
                    currentSlide === idx ? 'scale-110 z-10' : 'scale-100 opacity-70'
                  }`}
                  style={{
                    backgroundImage: `url('/imagenes/${area}.jpg')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                    <h3 className="text-white font-semibold text-lg p-4 capitalize">{area}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onShowAuth}
              className="px-8 py-4 bg-indigo-600 text-white text-lg font-semibold rounded-lg hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-lg"
            >
              Solicita tu Cotización Gratis
            </button>
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-indigo-600">500+</span> clientes satisfechos
            </div>
          </div>
        </div>
      </section>

      {/* CINTILLO DE CONFIANZA */}
      <section className="py-8 bg-white border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-sm text-gray-600 mb-4">Confían en nosotros</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 w-32 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-xs text-gray-500">Logo {i}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEMA */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-gray-900 mb-6 text-center">
            Sabemos lo Frustrante que Puede Ser
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-8">
            Sabemos lo frustrante que puede ser tener una cocina antigua, poco funcional o con un diseño que ya no se adapta a tus necesidades. 
            Muchas veces, las remodelaciones se vuelven un dolor de cabeza por <strong>atrasos</strong>, <strong>mala calidad en los acabados</strong> y 
            <strong> falta de compromiso</strong> de las empresas.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed mb-8">
            En nuestra mueblería, nos especializamos en eliminar esas preocupaciones. Te ofrecemos remodelaciones de cocina personalizadas, 
            con materiales de alta calidad, procesos claros y entrega garantizada, para que vivas la experiencia de renovar tu espacio sin estrés 
            y con resultados que superen tus expectativas.
          </p>
          
          {/* Beneficios en grid animado */}
          <div className="grid md:grid-cols-2 gap-6 mt-12">
            {[
              { icon: '🎨', title: 'Diseño Personalizado de Alto Nivel', desc: 'Cocinas a medida con distribución eficiente y estética moderna' },
              { icon: '🏗️', title: 'Materiales de Primera Calidad', desc: 'Durabilidad, sofisticación y acabados impecables' },
              { icon: '⏳', title: 'Entrega Puntual y Compromiso Real', desc: 'Respetamos rigurosamente los tiempos establecidos' },
              { icon: '💡', title: 'Asesoría Integral y Profesional', desc: 'Acompañamiento desde la conceptualización hasta la instalación' },
              { icon: '📋', title: 'Proceso Transparente y Organizado', desc: 'Presupuestos claros, cronogramas detallados y comunicación constante' },
              { icon: '👷', title: 'Equipo Especializado', desc: 'Altamente calificado en diseño, fabricación e instalación' }
            ].map((benefit, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="text-4xl mb-3">{benefit.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-lg font-semibold text-indigo-600 mt-12">
            Transforma tus espacios: cocina, closet y muebles a medida con la calidad, el diseño y la puntualidad que mereces.
          </p>
        </div>
      </section>

      {/* SOLUCIÓN */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-gray-900 mb-6 text-center">
            Nuestra Solución
          </h2>
          <p className="text-xl text-gray-700 text-center mb-12 max-w-3xl mx-auto">
            En <strong>Mueblería Casa Blanca</strong>, solucionamos los principales desafíos de la remodelación: 
            atrasos, falta de calidad, procesos desorganizados y resultados que no cumplen expectativas.
          </p>
          <p className="text-lg text-indigo-600 font-semibold text-center mb-12">
            👉 Diseñamos, fabricamos e instalamos cocinas a medida con materiales de alta gama, 
            control total del proceso y cumplimiento riguroso de los tiempos de entrega.
          </p>

          {/* Características con CTAs */}
          <div className="space-y-8">
            {[
              {
                icon: '🎨',
                title: 'Diseño Exclusivo y Personalizado',
                desc: 'Cada cocina es diseñada para optimizar tu espacio, mejorar la funcionalidad y reflejar tu estilo. No trabajamos con soluciones genéricas.',
                cta: 'Solicita una propuesta de diseño personalizada'
              },
              {
                icon: '🏗️',
                title: 'Materiales Premium y Acabados de Precisión',
                desc: 'Solo utilizamos materiales de alto rendimiento y acabados de calidad superior que garantizan durabilidad, estética y resistencia.',
                cta: 'Conoce nuestras opciones de materiales premium'
              },
              {
                icon: '⏳',
                title: 'Entrega Puntual, Compromiso Garantizado',
                desc: 'Nuestro proceso está diseñado para cumplir los plazos establecidos sin excepción. Nos diferenciamos por la organización y la precisión.',
                cta: 'Consulta nuestro cronograma de ejecución garantizado'
              },
              {
                icon: '🔧',
                title: 'Instalación Especializada y Detalle Impecable',
                desc: 'Contamos con un equipo técnico altamente calificado que asegura una instalación limpia, precisa y sin contratiempos.',
                cta: 'Agenda una visita técnica sin compromiso'
              },
              {
                icon: '📞',
                title: 'Proceso Transparente y Comunicación Profesional',
                desc: 'Desde la cotización hasta la entrega final, te ofrecemos información clara, seguimiento constante y respuesta inmediata.',
                cta: 'Habla con nuestro equipo de asesores ahora'
              }
            ].map((feature, idx) => (
              <div
                key={idx}
                className="flex flex-col md:flex-row gap-6 items-center bg-gradient-to-r from-indigo-50 to-white p-6 rounded-lg border border-indigo-100 hover:shadow-lg transition-all"
              >
                <div className="text-5xl">{feature.icon}</div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-700 mb-4">{feature.desc}</p>
                  <button
                    onClick={onShowAuth}
                    className="text-indigo-600 font-semibold hover:text-indigo-800 transition-colors"
                  >
                    👉 {feature.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-indigo-600 text-white p-8 rounded-lg text-center">
            <p className="text-xl font-semibold">
              Con Mueblería Casa Blanca, remodelar tu cocina deja de ser un riesgo para convertirse en una inversión segura, 
              con resultados que superan tus expectativas en calidad, tiempo y diseño.
            </p>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            Cómo Funciona
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Consulta', desc: 'Solicita tu cotización gratuita' },
              { step: '2', title: 'Diseño', desc: 'Creamos un diseño personalizado' },
              { step: '3', title: 'Fabricación', desc: 'Fabricamos con materiales premium' },
              { step: '4', title: 'Instalación', desc: 'Instalamos con precisión y cuidado' }
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-xl transition-all transform hover:-translate-y-2"
              >
                <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRUEBA SOCIAL */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            Lo que Dicen Nuestros Clientes
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'María González',
                role: 'Cliente Satisfecha',
                text: 'Excelente trabajo, cumplieron con los plazos y la calidad superó mis expectativas.',
                rating: 5
              },
              {
                name: 'Carlos Ramírez',
                role: 'Cliente Satisfecho',
                text: 'Profesionales desde el inicio. El diseño quedó perfecto y la instalación impecable.',
                rating: 5
              },
              {
                name: 'Ana Martínez',
                role: 'Cliente Satisfecha',
                text: 'Recomiendo totalmente. Materiales de primera y un equipo muy comprometido.',
                rating: 5
              }
            ].map((testimonial, idx) => (
              <div
                key={idx}
                className="bg-gray-50 p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-all"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">★</span>
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            Preguntas Frecuentes
          </h2>
          <div className="space-y-4">
            {[
              {
                q: '¿Cuánto tiempo toma una remodelación de cocina?',
                a: 'El tiempo varía según la complejidad, pero generalmente entre 4-8 semanas. Te proporcionamos un cronograma detallado desde el inicio.'
              },
              {
                q: '¿Qué garantía ofrecen?',
                a: 'Ofrecemos garantía en materiales y mano de obra. Todos nuestros trabajos están respaldados por nuestro compromiso de calidad.'
              },
              {
                q: '¿Puedo ver el diseño antes de aprobar?',
                a: 'Sí, te mostramos el diseño completo antes de comenzar la fabricación para que puedas hacer ajustes si es necesario.'
              },
              {
                q: '¿Qué materiales utilizan?',
                a: 'Trabajamos con materiales premium: melamina de alta calidad, herrajes europeos, encimeras de cuarzo y granito, entre otros.'
              },
              {
                q: '¿Cómo funciona el proceso de pago?',
                a: 'Trabajamos con pagos por etapas: inicial al aprobar el diseño, durante la fabricación y final al completar la instalación.'
              }
            ].map((faq, idx) => (
              <FAQItem key={idx} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 bg-indigo-600 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">
            ¿Listo para Transformar tu Espacio?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Contáctanos hoy mismo y permítenos crear un espacio funcional, elegante y completamente a tu medida.
          </p>
          <button
            onClick={onShowAuth}
            className="px-10 py-4 bg-white text-indigo-600 text-lg font-semibold rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
          >
            Solicita tu Cotización Gratis Ahora
          </button>
        </div>
      </section>
    </div>
  );
}

// Componente FAQ con animación
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-900">{question}</span>
        <span className={`text-2xl transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 py-4 text-gray-700 border-t border-gray-200">
          {answer}
        </div>
      </div>
    </div>
  );
}

