export type Show = {
  id: string;
  day: string;
  month: string;
  dateTime: string;
  time: string;
  title: string;
  tag: string;
  price: string;
  age: string;
  embedUrl?: string;
};

export type TicketOperator =
  | 'demo'
  | 'qtickets'
  | 'ticketscloud'
  | 'yandex'
  | 'timepad';

// Единственная точка редактирования контента.
// Неизвестные сведения оставлены пустыми.
export const site = {
    notFound: {
        code: '404',
        title: 'Страница не найдена',
        action: 'На главную',
    },
    name: 'Altzavod',
    alias: 'Altfactory',
    metadata: {
        title: 'Altzavod / Altfactory — концертная площадка в Твери',
        description: 'Altzavod / Altfactory — независимая андеграунд-площадка в Твери. Громкие гиги и честная музыка без глянца. Анонсы и подробности — в Telegram.'
    },
    navigation: [
        {
            label: 'Афиша',
            href: '#shows'
        },
        {
            label: 'О площадке',
            href: '#venue'
        },
        {
            label: 'Контакты',
            href: '#contacts'
        }
    ],
    ui: {
        tickets: 'Билеты',
        menu: 'Открыть меню',
        closeMenu: 'Закрыть меню',
        home: 'Altzavod — на главную',
        skip: 'Перейти к содержимому',
        arrow: 'Перейти',
        backToTop: 'Наверх',
        navigationLabel: 'Навигация по сайту'
    },
    hero: {
        eyebrow: 'Независимая андеграунд-площадка',
        city: 'Тверь',
        title: 'ALTZAVOD',
        tagline: 'Шум. Пот. Свой звук.',
        description: 'Независимая андеграунд-площадка в Твери. Громкие гиги, плотный слэм и честная музыка без глянца.',
        primary: 'Афиша и билеты',
        secondary: 'Ворваться в Telegram',
        visual: '/images/hero-industrial.svg',
        visualAlt: 'Индустриальная сцена в красном и белом свете',
        visualLabel: 'Территория громкого звука',
        scroll: 'Листай. Дальше громче.',
        ticker: ['ГРОМКО', 'ГРЯЗНО', 'ЖИВОЙ ЗВУК', 'ALTZAVOD', 'БЕЗ ЦЕНЗУРЫ']
    },
    showsSection: {
        eyebrow: 'БЛИЖАЙШИЕ СОБЫТИЯ',
        title: 'АФИША',
        mode: 'placeholder' as 'placeholder' | 'demo' | 'live',
        emptyLabel: 'ТИШИНА ПЕРЕД ШУМОМ',
        emptyTitle: 'Скоро раскачаем.',
        emptyDescription: 'Следи за анонсами в Telegram — всё самое важное падает туда первым.',
        status: 'Анонсы готовятся',
        demoLabel: 'Примеры событий / Скоро',
        demoNote: 'Демонстрационная афиша. Даты, артисты и цены вымышлены; продаж нет.',
        buyLabel: 'Купить билет',
        liveLabel: 'Ближайшие концерты',
        telegramLabel: 'Ворваться в Telegram'
    },
    shows: [
        {
            id: 'demo-1',
            day: '21',
            month: 'НОЯ',
            dateTime: '2027-11-21T19:00:00+03:00',
            time: '19:00',
            title: 'Электрический вечер',
            tag: 'Концерт',
            price: 'от 1 200 ₽',
            age: '18+',
        },
        {
            id: 'demo-2',
            day: '28',
            month: 'НОЯ',
            dateTime: '2027-11-28T18:00:00+03:00',
            time: '18:00',
            title: 'Новая волна',
            tag: 'Фест',
            price: 'от 900 ₽',
            age: '18+',
        },
        {
            id: 'demo-3',
            day: '05',
            month: 'ДЕК',
            dateTime: '2027-12-05T22:00:00+03:00',
            time: '22:00',
            title: 'После полуночи',
            tag: 'Вечеринка',
            price: 'от 700 ₽',
            age: '18+',
        },
    ] satisfies Show[],
    tickets: {
        provider: 'demo' as TicketOperator,
        // HTTPS embedUrl из кабинета оператора.
        // scriptUrl подключается только в открытой модалке.
        embedUrl: '',
        scriptUrl: '',
        offerUrl: '',
        title: 'Билеты в Altzavod',
        description: 'Выберите свою следующую встречу с музыкой.',
        demoLabel: 'ДЕМО / ПРОДАЖИ НЕ ОТКРЫТЫ',
        demoTitle: 'Твой следующий\nгромкий вечер',
        demoDescription: 'Это демонстрация билетного окна. Здесь нет оплаты, списаний и сбора данных. Настоящие билеты появятся после подключения оператора.',
        demoAction: 'Понятно, жду анонсов',
        demoStatus: 'Продажи скоро',
        closeLabel: 'Закрыть билетное окно',
        fallbackLabel: 'Открыть у билетного оператора',
        methods: ['СБП', 'Карты РФ'],
        methodsNote: 'Способы оплаты после подключения оператора',
        offerLabel: 'Оферта билетного оператора',
        loadingLabel: 'Загружаем билетное окно…',
        configError: 'Билетный оператор пока не подключён. Следите за анонсами.',
        securityNote: 'Оплата и обработка данных — на стороне билетного оператора.',
    },
    venue: {
        eyebrow: 'ПРОСТРАНСТВО',
        title: 'СВОЙ ЗВУК.\nСВОИ ЛЮДИ.',
        description: 'Altzavod / Altfactory — независимая сцена в Твери. Без глянца и лишней дистанции: артисты, зал и музыка, ради которой собираются свои.',
        placeholderNote: 'Концепция пространства: звук, свет, бар и зоны ниже описаны как заглушки. Оснащение, вместимость и условия уточняются у команды перед мероприятием.',
        features: [
            {
                title: 'Живой звук',
                description: 'Первый рифф, последний аккорд — и всё, что пробирает между ними.',
                icon: 'sound',
            },
            {
                title: 'Свет и атмосфера',
                description: 'Меньше глянца. Больше характера и своего света.',
                icon: 'spark',
            },
            {
                title: 'Место для своих',
                description: 'Зал, бар и зоны общения — без лишнего пафоса.',
                icon: 'people',
            },
            {
                title: 'Твоя идея — здесь',
                description: 'Гиг, фест или формат, которому пока нет названия.',
                icon: 'arrowUpRight',
            },
        ],
        gallery: [
            {
                src: '/images/venue-stage.svg',
                alt: 'Тёмная SVG-визуализация сцены и световых лучей',
                label: 'СЦЕНА',
            },
            {
                src: '/images/venue-floor.svg',
                alt: 'Тёмная SVG-визуализация индустриального зала',
                label: 'ПРОСТРАНСТВО',
            },
            {
                src: '/images/venue-light.svg',
                alt: 'Тёмная SVG-визуализация концертного освещения',
                label: 'АТМОСФЕРА',
            },
        ],
        galleryNote: 'Визуализации пространства. Настоящие фотографии появятся позже.',
    },
    contacts: {
        eyebrow: 'СВЯЗЬ И ДЕТАЛИ',
        title: 'КОНТАКТЫ',
        telegram: {
            title: 'Вся движуха — в Telegram',
            description: 'Никаких лишних карт и лишних глаз. Локация, время входа, лайнапы и закрытые анонсы — только в нашей группе.',
            buttonLabel: 'Ворваться в Telegram',
            pendingLabel: 'Ссылка скоро появится',
            href: 'https://t.me/altzavod' as string | null,
        
      longCTA: 'Ворваться в Telegram',
    },
        other: [
            { label: 'ВКонтакте', href: null as string | null },
            { label: 'Email', href: null as string | null }
        ]
    },
    cookies: {
        storageKey: 'altzavod-cookie-choice-v1',
        title: 'Немного о cookies',
        description: 'Сайт сохраняет выбор баннера. Билетный оператор может использовать собственные cookies.',
        acceptLabel: 'Понятно',
        rejectLabel: 'Не сохранять выбор',
        policyLabel: 'Подробнее',
    },
    footer: {
        copyright: 'Altzavod / Altfactory',
        tagline: 'Шум. Пот. Свой звук.',
        legalName: 'Реквизиты площадки — скоро',
        legalDetails: 'Юрлицо / ИП, ИНН и ОГРН / ОГРНИП заполняются владельцем до начала продаж.',
        privacy: {
            label: 'Политика ПДн',
            title: 'Информация о данных',
            body: 'На этом сайте нет форм обратной связи, подписки и собственных платёжных полей. Выбор баннера сохраняется локально в браузере. Билетный оператор обрабатывает данные по своим правилам. Полная политика с реквизитами оператора должна быть добавлена владельцем до публичного запуска.',
            href: null as string | null,
        },
        offer: {
            label: 'Оферта билетного оператора',
            href: null as string | null,
            pendingLabel: 'Оферта — после подключения продаж',
        },
        credit: 'Тверь. Независимая сцена.',
    },
} as const;

