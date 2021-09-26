import { last, slice, toInteger } from 'lodash';
import Head from 'next/head'
import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import Entry from '../components/Entry';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { intersectHook } from '../utils/hooks';
import { fetchEntries } from '../utils/queries';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import { useIntl, useTranslations } from 'use-intl';
import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote } from 'next-mdx-remote'

export default function Home(props) {

  const queryClient = useQueryClient()
  const loader = useRef(null);
  const [items, setItems] = useState([]);
  const [offset, setOffset] = useState(0);
  const t = useTranslations('home');
  const intl = useIntl();

  // Fetch Entries, on initial offset use rendered dataset.
  const { status, data, error, isFetching } = useQuery(['entries', offset],
    () => (offset == 0 ? props.data: fetchEntries(offset)),
    { keepPreviousData: true, staleTime: 5000 }
  )

  // On data fetch changes
  useEffect(() => {
    if (status == "success") {
      // Append Items On Successful Fetch
      setItems((items) => [...items, ...data.data]);
      // If Next Link Available, then pre-fetch.
      if (data.links.next){
        queryClient.prefetchQuery(['entries', offset + 1], () => fetchEntries(offset + 1));
      }
    }
  }, [status, data]);

  // When user is near intersecting end.
  intersectHook(()=> {
    setOffset((offset) => (offset + 1));
  }, "50%", loader);

  return (
    <>
      <Head>
        <title>COVID-19 Memorial</title>
      </Head>

      <Header />
      <main className={"md:container min-h-screen mx-auto px-4 py-1 mb-4"}>
        <div className="bg-base-300 rounded-xl my-1 lg:my-4">
          <div className="card">
            <div className="card-body text-sm md:text-base">
              <MDXRemote {...props.indexText} scope={{
                total: intl.formatNumber(props.cumDeaths),
                count: intl.formatNumber(props.count)
              }}/>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-10 xl:grid-cols-10 gap-2">
          {items.map((i) => (<Entry key={i.id} data={i}/>))}
        </div>
      </main>
      <div key="loader" ref={loader}>
          {isFetching? (<div className="text-center text-lg font-semibold px-4">
            <FontAwesomeIcon className="animate-spin w-5 h-5" icon={faSpinner} />
            <p>{t('loading')}</p>
          </div>) : []}
      </div>
      <Footer/>
    </>
  )
}

export async function getStaticProps({locale}) {
  const rawData = require('../data/latest.json');
  const keyData = require('../data/keys_latest.json');
  // Load Intro Text
  const fs = require('fs')
  const source = fs.readFileSync(`data/content/index_${locale}.mdx`, {encoding:'utf8', flag:'r'});
  const mdxSource = await serialize(source)
  return {
    props: {
      // Preload initial data 
      data: {
        data: slice(rawData,0,50),
        links: {
          next: '/api/entries?offset=1'
        }
      },
      count: rawData.length,
      cumDeaths: last(keyData).cumDeaths,
      indexText: mdxSource,
      messages: {
        ...require(`../lang/${locale}.json`),
      },
    }
  };
}