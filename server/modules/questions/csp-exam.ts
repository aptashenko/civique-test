import type { QuestionSnapshot } from '../quiz/domain/models'
import { cspTrainingQuestions } from './csp-training'
import situationSource from './data/csp/csp-situations-100.json' with { type: 'json' }

// Reviewed subset of the CSP knowledge list, grouped by the statutory notions.
const knowledge: Record<string, Record<string, string>> = {
  motto_and_symbols: {
    'csp-002': 'Marianne est une représentation de la République française.',
    'csp-004': 'L’article 2 de la Constitution définit la devise de la République.',
    'csp-021': 'L’article 2 de la Constitution établit le français comme langue de la République.',
    'csp-025': 'Le drapeau national est composé de trois bandes verticales, bleue, blanche et rouge.',
  },
  secularism: {
    'csp-029': 'La liberté de conscience permet de choisir une religion, d’en changer ou de n’en suivre aucune.',
    'csp-031': 'La loi du 9 décembre 1905 organise la séparation des Églises et de l’État.',
    'csp-032': 'La laïcité protège la liberté de conscience et garantit la neutralité de l’État envers les religions.',
  },
  democracy_and_voting: {
    'csp-048': 'Les élections législatives désignent les députés qui siègent à l’Assemblée nationale.',
    'csp-051': 'Les électeurs choisissent les conseillers municipaux. Le conseil municipal élit ensuite le maire.',
    'csp-053': 'L’âge minimum pour voter en France est de 18 ans. Les autres conditions dépendent du scrutin.',
    'csp-054': 'La Constitution fixe à cinq ans la durée du mandat du président de la République.',
  },
  french_republic: {
    'csp-038': 'L’article 8 de la Constitution confie au président de la République la nomination du Premier ministre.',
    'csp-039': 'Le Parlement français réunit deux chambres, l’Assemblée nationale et le Sénat.',
    'csp-070': 'Le préfet représente l’État dans le département.',
  },
  european_institutions: {
    'csp-079': 'Les citoyens de l’Union élisent les membres du Parlement européen tous les cinq ans.',
    'csp-083': 'La Journée de l’Europe commémore la déclaration Schuman du 9 mai 1950.',
  },
  fundamental_rights: {
    'csp-087': 'L’Assemblée nationale constituante a adopté la Déclaration des droits de l’homme et du citoyen en août 1789.',
    'csp-090': 'La liberté d’expression permet de communiquer ses idées. La loi en encadre certains abus, comme la diffamation.',
    'csp-097': 'La France a aboli la peine de mort en 1981. Son interdiction figure aussi dans la Constitution.',
  },
  resident_duties: {
    'csp-100': 'Produire moins de déchets aide à préserver les ressources et à limiter la pollution.',
    'csp-105': 'En cas d’infraction, la personne peut être sanctionnée selon les règles applicables.',
    'csp-108': 'Une infraction est un acte ou une omission que la loi pénale sanctionne.',
    'csp-113': 'En droit pénal français, le crime est la catégorie la plus grave, devant le délit et la contravention.',
  },
  history_periods_and_figures: {
    'csp-114': 'La Révolution française commence en 1789, année de la prise de la Bastille.',
    'csp-115': 'Napoléon Bonaparte devient empereur des Français en 1804.',
    'csp-118': 'La Shoah désigne le génocide des Juifs d’Europe par l’Allemagne nazie et ses collaborateurs.',
    'csp-126': 'Le décret du 27 avril 1848 abolit définitivement l’esclavage dans les colonies françaises.',
  },
  territories_and_geography: {
    'csp-134': 'La Seine traverse notamment Paris et Rouen avant de se jeter dans la Manche.',
    'csp-136': 'L’océan Atlantique longe notamment les côtes de la Bretagne et de la Nouvelle-Aquitaine.',
    'csp-140': 'La Réunion est un département et une région d’outre-mer situés dans l’océan Indien.',
    'csp-146': 'Une partie de la frontière entre la France et l’Italie traverse le massif des Alpes.',
  },
  french_heritage: {
    'csp-147': 'Molière a écrit des pièces de théâtre comme Le Tartuffe et Le Malade imaginaire.',
    'csp-151': 'Albert Camus a écrit des romans et des essais, dont L’Étranger et Le Mythe de Sisyphe.',
    'csp-156': 'Le Louvre est un musée parisien installé dans un ancien palais royal.',
  },
  settlement_and_residence: {
    'csp-163': 'Un véhicule doit être couvert au minimum par une assurance de responsabilité civile pour circuler.',
    'csp-165': 'Le délai habituel est de cinq jours, sans compter le jour de la naissance. Certaines communes de Guyane ont un délai plus long.',
  },
  healthcare_access: {
    'csp-175': 'L’Assurance Maladie prend en charge les frais de santé selon les règles du régime auquel la personne est affiliée.',
    'csp-183': 'Une mutuelle peut couvrir tout ou partie des frais restant après le remboursement de l’Assurance Maladie.',
  },
  working_in_france: {
    'csp-166': 'Le travail dissimulé est interdit. L’employeur doit notamment déclarer l’embauche de son salarié.',
    'csp-168': 'Le SMIC fixe le montant en dessous duquel un salarié adulte de droit commun ne peut en principe être payé.',
  },
  parental_authority_and_education: {
    'csp-185': 'Les titulaires de l’autorité parentale veillent à la sécurité, à la santé et à l’éducation de l’enfant.',
    'csp-188': 'Après le CM2, la sixième est la première classe du collège.',
  },
}

const situations: Record<string, string> = {
  'csp-situation-001': 'Le sexe est un critère de discrimination interdit à l’embauche. La candidate peut signaler les faits, notamment au Défenseur des droits.',
  'csp-situation-002': 'Chacun peut choisir et pratiquer sa religion dans le respect de la loi et des droits d’autrui.',
  'csp-situation-003': 'Un agent public doit rester neutre et traiter les personnes de façon égale quelles que soient leurs convictions.',
  'csp-situation-006': 'La liberté d’expression permet le désaccord. Les menaces et les violences peuvent être sanctionnées.',
  'csp-situation-009': 'La religion de l’enfant ou de sa famille ne peut pas être un critère d’exclusion de l’école publique.',
  'csp-situation-014': 'Le drapeau bleu, blanc et rouge est l’emblème national prévu par la Constitution.',
  'csp-situation-019': 'Le service public respecte l’égalité des usagers et la neutralité à l’égard des opinions politiques.',
  'csp-situation-020': 'Le principe de fraternité se traduit en pratique par la solidarité et l’entraide.',
  'csp-situation-043': 'Le mariage exige le consentement libre de chacun des futurs époux.',
  'csp-situation-045': 'La commune ou l’intercommunalité fixe les modalités de collecte des encombrants. Une déchèterie peut aussi les accepter.',
  'csp-situation-048': 'Utiliser un faux document peut constituer une infraction, même si la personne ne l’a pas fabriqué.',
  'csp-situation-049': 'Une victime peut déposer plainte dans un commissariat ou une brigade de gendarmerie.',
  'csp-situation-052': 'Le service des impôts peut examiner une demande de correction. La messagerie sécurisée du compte fiscal est un moyen de le contacter.',
  'csp-situation-053': 'Le bruit qui trouble le voisinage peut être sanctionné. Réduire le volume permet de faire cesser la nuisance.',
  'csp-situation-054': 'La publication d’une image permettant d’identifier une personne photographiée chez elle requiert son accord.',
  'csp-situation-059': 'Réutiliser les objets prolonge leur durée de vie. Le tri permet d’orienter les déchets vers les filières adaptées.',
}

const knowledgeById = new Map(cspTrainingQuestions.map(question => [question.questionId, question]))

export const cspExamQuestions: QuestionSnapshot[] = [
  ...Object.entries(knowledge).flatMap(([notionId, questions]) =>
    Object.entries(questions).map(([questionId, explanation]): QuestionSnapshot => {
      const question = knowledgeById.get(questionId)
      if (!question) throw new Error(`Missing CSP knowledge question: ${questionId}`)
      return { ...question, notionId, explanation, sourceType: 'official_knowledge' }
    }),
  ),
  ...situationSource.filter(question => Object.hasOwn(situations, question.id)).map((question): QuestionSnapshot => {
    const options = question.options.map((text, index) => ({ id: `option-${index + 1}`, text }))
    const correct = options[question.correctAnswer]
    if (!correct) throw new Error(`Invalid CSP situation answer: ${question.id}`)
    return {
      questionId: question.id,
      version: 1,
      type: 'single_select',
      text: question.question,
      options,
      correctOptionIds: [correct.id],
      explanation: situations[question.id]!,
      categoryId: question.category,
      translations: {},
      sourceType: 'practice_situation',
    }
  }),
]
