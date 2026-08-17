export type ProjectStatus = "en-comercializacion" | "finalizado";

export type Project = {
  slug: string;
  name: string;
  shortName: string;
  status: ProjectStatus;
  location: string;
  neighborhood: string;
  city: string;
  /** Estado de obra — solo proyectos activos. Placeholder hasta datos reales. */
  stage?: "En pozo" | "Por comenzar";
  /** Cuadrados disponibles — placeholder hasta números reales de Córdoba/Sow. */
  squaresAvailable?: string;
  headline: string;
  summary: string;
  highlights: string[];
  neighborhoodCopy: string;
  spacesCopy?: string;
  coverImage: string;
  gallery: { src: string; alt: string }[];
};

export const projects: Project[] = [
  {
    slug: "sow",
    name: "Sow",
    shortName: "Sow",
    status: "en-comercializacion",
    location: "Beauchef, entre Valle y Av. Pedro Goyena",
    neighborhood: "Caballito",
    city: "Buenos Aires",
    // Demo — pendiente de datos reales (ver brief: "pasar los números reales de cuadrados").
    stage: "En pozo",
    squaresAvailable: "Consultar disponibilidad",
    headline: "Luz, amplitud y equilibrio en Caballito",
    summary:
      "Cuadrados amplios con vistas al frente y balcones con parrilla privada. Una propuesta contemporánea y sobria en un barrio con historia y proyección.",
    highlights: [
      "Cuadrados con balcón y parrilla",
      "Fachada de líneas puras y proporciones equilibradas",
      "Último nivel con cuadrado exclusivo y expansión propia",
      "Cercanía a Av. Pedro Goyena y oferta gastronómica del barrio",
    ],
    neighborhoodCopy:
      "Caballito combina tradición y renovación. Sus calles arboladas, la cercanía a Pedro Goyena y su oferta cultural lo consolidan como una de las zonas más buscadas de Buenos Aires.",
    spacesCopy:
      "Los livings se abren a balcones-terraza. Cocinas integradas, dormitorios con suite e iluminación natural priorizan la vida cotidiana con confort.",
    coverImage: "/images/projects/beauchef-cover.jpg",
    gallery: [
      { src: "/images/projects/beauchef-cover.jpg", alt: "Sow exterior diurno" },
      { src: "/images/projects/beauchef-dusk.jpg", alt: "Sow exterior atardecer" },
      { src: "/images/projects/beauchef-living.jpg", alt: "Sow living comedor" },
      { src: "/images/projects/beauchef-acceso.jpg", alt: "Sow acceso" },
    ],
  },
  {
    slug: "cordoba",
    name: "Córdoba",
    shortName: "Córdoba",
    status: "en-comercializacion",
    // Demo — proyecto nuevo, datos pendientes del lado del cliente.
    location: "A confirmar",
    neighborhood: "Nueva Córdoba",
    city: "Córdoba",
    stage: "Por comenzar",
    squaresAvailable: "Consultar disponibilidad",
    headline: "Un nuevo proyecto Freya fuera de Buenos Aires",
    summary:
      "Primer desarrollo de Freya en Córdoba. Misma mirada de siempre — escala humana y personalización real — en un mercado nuevo para la marca.",
    highlights: [
      "Primer proyecto de Freya en Córdoba",
      "Datos de ubicación y cuadrados a confirmar",
    ],
    neighborhoodCopy:
      "Nueva Córdoba es uno de los barrios de mayor movimiento de la ciudad, con cercanía al Parque Sarmiento y a la vida universitaria.",
    coverImage: "/images/projects/pinamar-cover.jpg",
    gallery: [
      { src: "/images/projects/pinamar-cover.jpg", alt: "Córdoba — imagen provisoria" },
      { src: "/images/projects/pinamar-1.jpg", alt: "Córdoba — imagen provisoria" },
    ],
  },
  {
    slug: "besares-4786",
    name: "Besares 4786",
    shortName: "Besares",
    status: "finalizado",
    location: "Frente al Parque Saavedra",
    neighborhood: "Saavedra",
    city: "Buenos Aires",
    headline: "Simple, luminoso y funcional frente al parque",
    summary:
      "Cuadrados con tipologías para distintos estilos de vida, frente al Parque Saavedra. Proyecto cerrado — ya no está en comercialización.",
    highlights: [
      "Frente al Parque Saavedra",
      "Todos los cuadrados con balcón propio",
    ],
    neighborhoodCopy:
      "Saavedra vive un momento de renovación: calles tranquilas, cercanía al parque y nuevas propuestas gastronómicas lo posicionan entre los barrios con más proyección de la ciudad.",
    coverImage: "/images/projects/besares-cover.png",
    gallery: [
      { src: "/images/projects/besares-cover.png", alt: "Besares 4786 exterior diurno" },
      { src: "/images/projects/besares-night.png", alt: "Besares 4786 exterior nocturno" },
      { src: "/images/projects/besares-living.png", alt: "Besares living" },
      { src: "/images/projects/besares-entrada.png", alt: "Besares entrada" },
    ],
  },
  {
    slug: "directorio",
    name: "Directorio",
    shortName: "Directorio",
    status: "finalizado",
    // Demo — proyecto placeholder, datos a confirmar.
    location: "Av. Directorio",
    neighborhood: "Parque Chacabuco",
    city: "Buenos Aires",
    headline: "Obra de Freya en Parque Chacabuco",
    summary: "Proyecto cerrado — ya no está en comercialización.",
    highlights: ["Datos a confirmar"],
    neighborhoodCopy:
      "Parque Chacabuco es un barrio residencial consolidado, con buena conectividad y cercanía al parque que le da nombre.",
    coverImage: "/images/projects/pareja-cover.jpg",
    gallery: [
      { src: "/images/projects/pareja-cover.jpg", alt: "Directorio — imagen provisoria" },
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
