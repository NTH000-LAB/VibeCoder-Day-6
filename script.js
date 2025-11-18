class GeoExplorer {
    constructor() {
        this.countries = new Map();
        this.init();
    }

    init() {
        this.setupEvents();
    }

    setupEvents() {
        const searchInput = document.getElementById('search');
        const searchButton = document.getElementById('search-btn');
        
        searchButton.addEventListener('click', () => {
            this.handleSearch(searchInput.value.trim());
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch(e.target.value.trim());
            }
        });

        document.querySelectorAll('.quick-country').forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleSearch(btn.dataset.country);
            });
        });
    }

    async handleSearch(query) {
        if (!query) {
            this.showPlaceholder();
            return;
        }

        this.setLoading(true);

        try {
            const country = await this.findCountry(query);
            if (country) {
                this.displayCountry(country);
            } else {
                this.showError('Pays non trouvé. Vérifiez l\'orthographe.');
            }
        } catch (error) {
            this.showError('Erreur de connexion. Réessayez.');
        } finally {
            this.setLoading(false);
        }
    }

    async findCountry(query) {
        const normalizedQuery = this.normalizeText(query);
        
        if (this.countries.has(normalizedQuery)) {
            return this.countries.get(normalizedQuery);
        }

        const frenchNames = {
            'cote divoire': 'ivory coast',
            'côte divoire': 'ivory coast',
            'cote d\'ivoire': 'ivory coast',
            'côte d\'ivoire': 'ivory coast',
            'republique democratique du congo': 'democratic republic of the congo',
            'republique du congo': 'republic of the congo',
            'guinee equatoriale': 'equatorial guinea',
            'guinée équatoriale': 'equatorial guinea',
            'guinee bissau': 'guinea-bissau',
            'sao tome et principe': 'sao tome and principe',
            'sao tomé et principe': 'sao tome and principe',
            'cap vert': 'cape verde',
            'iles comores': 'comoros',
            'îles comores': 'comoros'
        };

        if (frenchNames[normalizedQuery]) {
            query = frenchNames[normalizedQuery];
        }

        try {
            const response = await fetch(`https://restcountries.com/v3.1/name/${query}`);
            if (response.ok) {
                const data = await response.json();
                const country = data[0];
                this.countries.set(normalizedQuery, country);
                return country;
            }
        } catch (e) {}

        try {
            const response = await fetch('https://restcountries.com/v3.1/all');
            const allCountries = await response.json();
            
            const found = allCountries.find(country => {
                const commonName = this.normalizeText(country.name.common);
                const officialName = this.normalizeText(country.name.official);
                const frenchName = country.translations?.fra?.common ? 
                    this.normalizeText(country.translations.fra.common) : '';
                
                return commonName.includes(normalizedQuery) ||
                       officialName.includes(normalizedQuery) ||
                       frenchName.includes(normalizedQuery);
            });

            if (found) {
                this.countries.set(normalizedQuery, found);
                return found;
            }
        } catch (e) {}

        return null;
    }

    normalizeText(text) {
        return text.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }

    displayCountry(country) {
        const display = document.getElementById('country-display');
        const frenchName = country.translations?.fra?.common || country.name.common;
        
        display.innerHTML = `
            <div class="country-header fade-in">
                <img src="${country.flags.png}" class="country-flag" alt="Drapeau ${frenchName}">
                <div>
                    <h1 class="country-title">${frenchName}</h1>
                    <div class="country-subtitle">${country.name.official}</div>
                    <div class="country-subtitle">${country.region} • ${country.subregion || ''}</div>
                    <a href="https://www.google.com/maps/search/${encodeURIComponent(frenchName)}" 
                       class="map-redirect" target="_blank">
                       📍 Voir sur Google Maps
                    </a>
                </div>
            </div>
            
            <div class="info-grid">
                ${this.createInfoCard('Population', this.formatNumber(country.population))}
                ${this.createInfoCard('Superficie', this.formatNumber(country.area) + ' km²')}
                ${this.createInfoCard('Capitale', country.capital?.[0] || 'N/A')}
                ${this.createInfoCard('Devise', this.getCurrency(country.currencies))}
                ${this.createInfoCard('Langues', this.getLanguages(country.languages))}
                ${this.createInfoCard('Continent', country.region)}
                ${this.createInfoCard('Indépendant', country.independent ? 'Oui' : 'Non')}
            </div>
            
            <div class="country-description fade-in">
                <h3>Description</h3>
                <p>${this.generateDescription(country)}</p>
            </div>
        `;
    }

    createInfoCard(label, value) {
        return `
            <div class="info-card">
                <div class="info-label">${label}</div>
                <div class="info-value">${value}</div>
            </div>
        `;
    }

    getCurrency(currencies) {
        if (!currencies) return 'N/A';
        return Object.values(currencies).map(c => c.name).join(', ');
    }

    getLanguages(languages) {
        if (!languages) return 'N/A';
        return Object.values(languages).join(', ');
    }

    generateDescription(country) {
        const frenchName = country.translations?.fra?.common || country.name.common;
        let description = `${frenchName} est un pays `;
        
        if (country.region) {
            description += `situé en ${country.region}. `;
        }
        
        description += `Il compte environ ${this.formatNumber(country.population)} habitants `;
        description += `et couvre une superficie de ${this.formatNumber(country.area)} km². `;
        
        if (country.capital) {
            description += `Sa capitale est ${country.capital[0]}. `;
        }
        
        if (country.languages) {
            const languages = Object.values(country.languages);
            if (languages.length === 1) {
                description += `La langue officielle est le ${languages[0]}.`;
            } else {
                description += `Les langues officielles sont : ${languages.join(', ')}.`;
            }
        }

        return description;
    }

    setLoading(loading) {
        const button = document.getElementById('search-btn');
        const text = button.querySelector('.btn-text');
        const loadingEl = button.querySelector('.btn-loading');
        
        if (loading) {
            text.style.display = 'none';
            loadingEl.style.display = 'inline';
            button.disabled = true;
        } else {
            text.style.display = 'inline';
            loadingEl.style.display = 'none';
            button.disabled = false;
        }
    }

    showPlaceholder() {
        const display = document.getElementById('country-display');
        display.innerHTML = `
            <div class="placeholder">
                <div class="placeholder-icon">🗺️</div>
                <h3>Bienvenue sur GeoExplorer</h3>
                <p>Recherchez un pays pour découvrir ses informations</p>
                <div class="tips">
                    <div>🌍 <strong>195 pays</strong> à découvrir</div>
                    <div>🇫🇷 <strong>Noms français</strong> acceptés</div>
                    <div>🔍 <strong>Recherche facile</strong> par nom ou code</div>
                </div>
            </div>
        `;
    }

    showError(message) {
        const display = document.getElementById('country-display');
        display.innerHTML = `
            <div class="placeholder">
                <div class="placeholder-icon">❌</div>
                <h3>${message}</h3>
                <p>Essayez avec un nom différent ou vérifiez l'orthographe</p>
            </div>
        `;
    }

    formatNumber(num) {
        return new Intl.NumberFormat('fr-FR').format(num);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.geoApp = new GeoExplorer();
});