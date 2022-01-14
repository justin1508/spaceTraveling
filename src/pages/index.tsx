import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import Head from 'next/head';
import Link from 'next/link';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useState } from 'react';
import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  // console.log(postsPagination);
  // TODO
  const { next_page, results } = postsPagination;
  const [posts, setPosts] = useState<Post[]>(results);
  const [nextPage, setNextPage] = useState<string>(next_page);

  const loadPosts = async (): Promise<void> => {
    setTimeout(async () => {
      if (next_page) {
        try {
          const response = await fetch(next_page);

          const data: Promise<PostPagination> = (await response).json();

          const newPosts = (await data).results.map((post: Post) => ({
            uid: post.uid,
            first_publication_date: format(
              new Date(post.first_publication_date),
              'dd MMM yyyy',
              { locale: ptBR }
            ),
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          }));

          setNextPage(null);
          setPosts([...posts, ...newPosts]);
        } catch (err) { }
      }
    }, 200);
  };

  const handleLoadPostsClick = (): void => {
    loadPosts();
  };

  return (
    <>
      <Head>
        <title>Home | spaceTraveling</title>
      </Head>

      <main className={styles.container}>
        <div className={styles.posts}>
          {posts.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle} </p>

                <div>
                  <FiCalendar />
                  <span>
                    {format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy',
                      {
                        locale: ptBR,
                      }
                    )}
                  </span>

                  <FiUser />
                  <span>{post.data.author}</span>
                </div>
              </a>
            </Link>
          ))}
          {nextPage && (
            <button
              type="button"
              className={styles.button}
              onClick={handleLoadPostsClick}
            >
              Carregar mais posts
            </button>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const response = await prismic.query(
    [
      // Busca as publicações
      Prismic.Predicates.at('document.type', 'post'),
    ],
    {
      // Traz o título e conteúdo das publicações e a quantidade por página
      fetch: ['post.title', 'post.subtitle', 'post.author'],
      pageSize: 1,
    }
  );

  // console.log(JSON.stringify(response, null, 2));

  const posts = response.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      // first_publication_date: format(
      //   new Date(post.first_publication_date),
      //   'dd MMM yyyy',
      //   {
      //     locale: ptBR,
      //   }
      // ),
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  // TODO
  return {
    props: {
      postsPagination: {
        results: posts,
        next_page: response.next_page,
      },
    },
  };
};
