import './css/inspectorSections.scss';
const {
    element: {
        useEffect,
        useState
    },
    i18n: {__},
    data: {withDispatch},
    blocks: {parse}
} = wp;


const Sections = (props) => {
    const [sections, setSections] = useState([]);
    const block = typeof props.block !== 'undefined' ? props.block : '';
    const storeName = '_qubely_local_cache_';
    const storeNameDate = '_last_update_';

    useEffect(() => {
        const today = new Date();
        const endpoint = 'http://qubely.io/wp-json/restapi/v2/sections';
        const _fetchData = () => {
            fetch(endpoint, {
                method: 'POST',
                body: block ? new URLSearchParams('block_name='+block) : ''
            })
            .then(response => response.ok ? response.json() : Promise.reject(response))
            .then(response => {
                const cacheExp = new Date().setDate(today.getDate() + 1);
                setSections(response);
                _setStore('sections', response);
                _syncSections(response);
            })
            .catch( (err) => {
                console.warn('Something went wrong.', err);
            });
        };

        const sectionData = _getStoreData('sections');
        if(sectionData) {
            const sectionExpDate = _getStoreData(storeNameDate);
            if(sectionExpDate !== null && today > sectionExpDate ){
                _clearStore();
                _fetchData();
            }else{
                setSections(sectionData)
            }
        }else{
            _fetchData();
        }

        const _syncSections = sections => {
            sections.forEach(section => {
                _fetchSection(section.ID);
            })
        }

    }, []);

    const _fetchSection = (section_id, callback) => {
        const endpoint = 'https://qubely.io/wp-json/restapi/v2/single-section';
        fetch(endpoint, {
            method: 'POST',
            body: new URLSearchParams('section_id='+ section_id)
        })
        .then(response => response.ok ? response.json() : Promise.reject(response))
        .then(response => {
            _setStore(section_id, response.rawData);
            callback && callback();
        })
        .catch( err => {
            console.warn('Something went wrong.', err);
        });
    }

    const _insertSection = section_id => {
        const {insertBlocks} = props
        const sectionData = _getStoreData(section_id);
        if(sectionData !== null){
            insertBlocks(parse(sectionData));
        }else{
            _fetchSection(section_id, () => {
                const sectionData = _getStoreData(section_id);
                insertBlocks(parse(sectionData));
            })
        }
    }

    // Get full storage
    const _getStore = () => {
        let store = window.localStorage.getItem(storeName);
        store = JSON.parse(store);
        return store ? store : null;
    };

    // Get data from storage by key
    const _getStoreData = key => {
        let store = _getStore();
        store = store !== null && typeof store[block] !== 'undefined' && typeof store[block][key] !== 'undefined' ? store[block][key] : null;
        return store;
    };

    // Set data to storage
    const _setStore = (key, newData) => {
        if(typeof key === 'undefined' || typeof newData === 'undefined') {
            return false;
        }
        let storage = _getStore() ? _getStore() : {};
        if(typeof storage[block] === 'undefined'){
            storage[block] = {}
        }
        storage[block][key] = newData;
        storage = JSON.stringify(storage);
        window.localStorage.setItem(storeName, storage);
    };

    const _clearStore = () => window.localStorage.setItem(storeName, JSON.stringify({}));

    return (
        <div className='qubely-block-sections'>
            {
                sections.map(section => (
                    <div className='qubely-block-section'>
                        <img width='330' height='230' loading='lazy' src={section.image} alt={section.name} />
                        <div className="qubely-block-section-btns">
                            <button onClick={() => _insertSection(section.ID)}>{__('Import')}</button>
                        </div>
                    </div>
                ))
            }
        </div>
    )
};

export default withDispatch((dispatch) => ({ insertBlocks : dispatch('core/block-editor').insertBlocks }))(Sections)