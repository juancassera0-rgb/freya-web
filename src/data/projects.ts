export type ProjectStatus = "en-comercializacion" | "finalizado";

export type Project = {
  slug: string;
  name: string;
  shortName: string;
  status: ProjectStatus;
  location: string;
  neighborhood: string;
  city: string;
  type: string;
  floors?: string;
  units?: string;
  surfaces: string;
  typologies: string;
  headline: string;
  summary: string;
  highlights: string[];
  neighborhoodCopy: string;
  spacesCopy?: string;
  buyerProfile: string;
  ctaMessage: string;
  coverImage: string;
  gallery: { src: string; alt: string }[];
};

export const projects: Project[] = [
  {
    slug: "beauchef-620",
    name: "Beauchef 620",
    shortName: "Beauchef",
    status: "en-comercializacion",
    location: "Beauchef, entre Valle y Av. Pedro Goyena",
    neighborhood: "Caballito",
    city: "Buenos Aires",
    type: "Edificio residencial",
    floors: "9 pisos",
    surfaces: "Desde 178 m²",
    typologies: "4 ambientes",
    headline: "Luz, amplitud y equilibrio en Caballito",
    summary:
      "Viviendas amplias de cuatro ambientes con vistas al frente y balcones con parrilla privada. Una propuesta contemporánea y sobria en un barrio con historia y proyección.",
    highlights: [
      "Unidades de 4 ambientes con balcón y parrilla",
      "Fachada de líneas puras y proporciones equilibradas",
      "Último nivel con unidad exclusiva y expansión propia",
      "Cercanía a Av. Pedro Goyena y oferta gastronómica del barrio",
    ],
    neighborhoodCopy:
      "Caballito combina tradición y renovación. Sus calles arboladas, la cercanía a Pedro Goyena y su oferta cultural lo consolidan como una de las zonas más buscadas de Buenos Aires.",
    spacesCopy:
      "Los livings se abren a balcones-terraza. Cocinas integradas, dormitorios con suite e iluminación natural priorizan la vida cotidiana con confort.",
    buyerProfile: "Familias y compradores que buscan 4 ambientes con calidad barrial",
    ctaMessage: "Hola Freya, quiero consultar por Beauchef 620.",
    coverImage: "/images/projects/beauchef-cover.jpg",
    gallery: [
      { src: "/images/projects/beauchef-cover.jpg", alt: "Beauchef 620 exterior diurno" },
      { src: "/images/projects/beauchef-dusk.jpg", alt: "Beauchef 620 exterior atardecer" },
      { src: "/images/projects/beauchef-living.jpg", alt: "Beauchef 620 living comedor" },
      { src: "/images/projects/beauchef-acceso.jpg", alt: "Beauchef 620 acceso" },
    ],
  },
  {
    slug: "besares-4786",
    name: "Besares 4786",
    shortName: "Besares",
    status: "en-comercializacion",
    location: "Frente al Parque Saavedra",
    neighborhood: "Saavedra",
    city: "Buenos Aires",
    type: "Edificio residencial",
    floors: "10 pisos",
    surfaces: "38 m² · 48 m² · 97 m²",
    typologies: "1, 2 y 3 ambientes",
    headline: "Simple, luminoso y funcional frente al parque",
    summary:
      "Diez pisos con tipologías para distintos estilos de vida. Los 3 ambientes al frente miran al Parque Saavedra; los 1 y 2 ambientes al contrafrente aprovechan luz y ventilación cruzada.",
    highlights: [
      "Frente al Parque Saavedra",
      "Tipologías 1, 2 y 3 ambientes",
      "Todos los departamentos con balcón propio",
      "Ideal para vivir o invertir en un barrio en crecimiento",
    ],
    neighborhoodCopy:
      "Saavedra vive un momento de renovación: calles tranquilas, cercanía al parque y nuevas propuestas gastronómicas lo posicionan entre los barrios con más proyección de la ciudad.",
    spacesCopy:
      "Cocinas integradas al estar, materiales neutros y cálidos, y balcones pensados para disfrutar el verde del entorno.",
    buyerProfile: "Compradores e inversores en tipologías flexibles cerca del verde",
    ctaMessage: "Hola Freya, quiero consultar por Besares 4786.",
    coverImage: "/images/projects/besares-cover.png",
    gallery: [
      { src: "/images/projects/besares-cover.png", alt: "Besares 4786 exterior diurno" },
      { src: "/images/projects/besares-night.png", alt: "Besares 4786 exterior nocturno" },
      { src: "/images/projects/besares-living.png", alt: "Besares living 3 ambientes" },
      { src: "/images/projects/besares-entrada.png", alt: "Besares entrada" },
    ],
  },
  {
    slug: "solares-de-pinamar-vi",
    name: "Solares de Pinamar VI",
    shortName: "Solares VI",
    status: "finalizado",
    location: "Entorno de bosque y golf",
    neighborhood: "Pinamar",
    city: "Buenos Aires",
    type: "Complejo residencial",
    units: "8 departamentos",
    surfaces: "80 m²",
    typologies: "Dúplex, 3 y 4 ambientes",
    headline: "Arquitectura moderna integrada al bosque de Pinamar",
    summary:
      "Complejo de 2.000 m² inmerso en el bosque, con vistas al hoyo 10 del golf de Pinamar. Amplitud, luminosidad y privacidad en un entorno único.",
    highlights: [
      "2.000 m² en entorno de bosque y golf",
      "8 departamentos · dúplex 3 y 4 ambientes",
      "Líneas puras integradas a la naturaleza",
      "Estilo de vida de descanso y contemplación",
    ],
    neighborhoodCopy:
      "Ubicado en una de las zonas más tranquilas y clásicas de Pinamar, ofrece contacto directo con los árboles y el verde del golf.",
    buyerProfile: "Segundo hogar y vivienda de descanso en Pinamar",
    ctaMessage: "Hola Freya, me interesa conocer más sobre Solares de Pinamar VI.",
    coverImage: "/images/projects/pinamar-cover.jpg",
    gallery: [
      { src: "/images/projects/pinamar-cover.jpg", alt: "Solares de Pinamar VI" },
      { src: "/images/projects/pinamar-1.jpg", alt: "Solares de Pinamar VI detalle" },
      { src: "/images/projects/pinamar-2.jpg", alt: "Solares de Pinamar VI entorno" },
    ],
  },
  {
    slug: "pareja-4208",
    name: "Pareja 4208",
    shortName: "Pareja",
    status: "finalizado",
    location: "A pocas cuadras de Plaza Arenales",
    neighborhood: "Villa Devoto",
    city: "Buenos Aires",
    type: "Edificio residencial",
    units: "20 departamentos",
    surfaces: "106 m²",
    typologies: "4 ambientes",
    headline: "Elegancia y balcones amplios en Villa Devoto",
    summary:
      "Edificio de 1.200 m² en una de las zonas más clásicas y residenciales de Devoto, con balcones y terrazas que abren los espacios al exterior.",
    highlights: [
      "1.200 m² construidos · 20 departamentos",
      "Tipología 4 ambientes",
      "Cercanía a Plaza Arenales",
      "Calles arboladas y excelente conectividad",
    ],
    neighborhoodCopy:
      "Villa Devoto combina calles tranquilas, arboledas y cercanía a avenidas clave: un entorno residencial consolidado y buscado.",
    buyerProfile: "Familias en barrio residencial consolidado",
    ctaMessage: "Hola Freya, quiero saber más sobre Pareja 4208.",
    coverImage: "/images/projects/pareja-cover.jpg",
    gallery: [
      { src: "/images/projects/pareja-cover.jpg", alt: "Pareja 4208" },
      { src: "/images/projects/pareja-1.jpg", alt: "Pareja 4208 detalle" },
    ],
  },
  {
    slug: "nueva-york-2585",
    name: "Nueva York 2585",
    shortName: "Nueva York",
    status: "finalizado",
    location: "Cerca de Plaza Arenales",
    neighborhood: "Villa Devoto",
    city: "Buenos Aires",
    type: "Edificio residencial",
    floors: "4 pisos",
    surfaces: "120 m²",
    typologies: "4 ambientes",
    headline: "Vida de barrio con accesibilidad metropolitana",
    summary:
      "Edificio de 1.000 m² que aprovecha visuales urbanas y luz natural, en el equilibrio entre la calma de Devoto y la conexión con la ciudad.",
    highlights: [
      "1.000 m² · 4 pisos · 4 ambientes",
      "Excelente conectividad",
      "Entorno residencial lejos del bullicio",
      "Luz natural y espacios confortables",
    ],
    neighborhoodCopy:
      "Aquí confluyen la tranquilidad de Villa Devoto —el jardín de Buenos Aires— con la cercanía a ejes urbanos y servicios.",
    buyerProfile: "Quienes buscan vivienda amplia en barrio tranquilo",
    ctaMessage: "Hola Freya, quiero información sobre Nueva York 2585.",
    coverImage: "/images/projects/nueva-york-cover.jpg",
    gallery: [
      { src: "/images/projects/nueva-york-cover.jpg", alt: "Nueva York 2585" },
      { src: "/images/projects/nueva-york-1.jpg", alt: "Nueva York 2585 detalle" },
    ],
  },
  {
    slug: "aranguren-1160",
    name: "Aranguren 1160",
    shortName: "Aranguren",
    status: "finalizado",
    location: "Caballito",
    neighborhood: "Caballito",
    city: "Buenos Aires",
    type: "Edificio residencial",
    floors: "9 pisos",
    surfaces: "130 m²",
    typologies: "4 ambientes",
    headline: "Propuesta moderna en un barrio en constante evolución",
    summary:
      "Edificio de 1.700 m² en Caballito, con distribución funcional, balcones amplios y una ubicación estratégica por conectividad y servicios.",
    highlights: [
      "1.700 m² construidos · 9 pisos",
      "Tipología 4 ambientes",
      "Balcones amplios y luminosos",
      "Alta demanda residencial en Caballito",
    ],
    neighborhoodCopy:
      "Caballito es una zona estratégica de la Ciudad por dinamismo, conectividad y oferta de servicios: un punto de alta demanda residencial.",
    buyerProfile: "Compradores e inversores orientados a Caballito",
    ctaMessage: "Hola Freya, me interesa Aranguren 1160.",
    coverImage: "/images/projects/aranguren-cover.jpg",
    gallery: [
      { src: "/images/projects/aranguren-cover.jpg", alt: "Aranguren 1160" },
      { src: "/images/projects/aranguren-1.jpg", alt: "Aranguren 1160 detalle" },
    ],
  },
];

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}

export function getActiveProjects() {
  return projects.filter((p) => p.status === "en-comercializacion");
}

export function getFinishedProjects() {
  return projects.filter((p) => p.status === "finalizado");
}
