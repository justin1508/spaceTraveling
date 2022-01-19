import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

import Comments from '../../components/Comments';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  sugestions: {
    prevPost?: {
      uid: string;
      data: {
        title: string;
      };
    }[];
    nextPost?: {
      uid: string;
      data: {
        title: string;
      };
    }[];
  };
}

export default function Post({ post, sugestions }: PostProps) {
  // TODO
  const router = useRouter();
  // if (router.isFallback) <p> Carregando... </p>;

  const totalWords = post.data.content.reduce((total, contentItem) => {
    let count = 0;
    count += contentItem.heading.split(' ').length;

    const wordsCounter = contentItem.body.map(
      item => item.text.split(' ').length
    );
    wordsCounter.map(words => (count += words));

    total += count;

    return total;
  }, 0);

  const readTime = Math.ceil(totalWords / 200);
  const firstPublicationDate = format(
    new Date(post.first_publication_date),
    "'*editado em' dd MMM yyyy, 'às' H':'m",
    {
      locale: ptBR,
    }
  );

  const lastPublicationDate = format(
    new Date(post.last_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBR,
    }
  );

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  return (
    <>
      <Head>
        <title>{post.data.title} | spaceTraveling</title>
      </Head>
      <main className={styles.container}>
        <img src={`${post.data.banner.url}`} alt={post.data.title} />
        <article className={styles.post}>
          <h1>{post.data.title}</h1>
          <section>
            <FiCalendar />
            <span>{firstPublicationDate}</span>

            <FiUser />
            <span>{post.data.author}</span>

            <FiClock />
            <span>{`${readTime} min`}</span>
          </section>
          {lastPublicationDate ? <span>{lastPublicationDate}</span> : null}
          {post.data.content.map(p => (
            <div className={styles.postContent} key={p.heading}>
              <h2>{p.heading}</h2>
              {p.body.map(b => (
                <p key={b.text}>{b.text}</p>
              ))}
            </div>
          ))}
        </article>

        <section className={styles.sugestions}>
          {sugestions.prevPost[0] ? (
            <div>
              <p>{sugestions.prevPost[0].data.title}</p>
              <Link href={`/post/${sugestions.prevPost[0].uid}`}>
                <a>Post anterior</a>
              </Link>
            </div>
          ) : null}
          {sugestions.nextPost[0] ? (
            <div>
              <p>{sugestions.nextPost[0].data.title}</p>
              <Link href={`/post/${sugestions.nextPost[0].uid}`}>
                <a>Próximo post</a>
              </Link>
            </div>
          ) : null}
        </section>
        {router.isFallback && <span>Carregando...</span>}
      </main>
      <Comments sugestions={sugestions} />
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [
      // Busca as publicações
      Prismic.Predicates.at('document.type', 'post'),
    ],
    {
      // Traz o título e conteúdo das publicações e a quantidade por página
      fetch: ['post.title', 'post.subtitle', 'post.author'],
      pageSize: 100,
    }
  );
  // console.log(JSON.stringify(posts, null, 2));

  const paths = posts.results.map(post => ({ params: { slug: post.uid } }));

  return {
    // paths: [{ params: { posts } }],
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  // const blogSlug = context.params.slug;
  const { slug } = params;
  // console.log(params);
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});

  const prevPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'post')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
    }
  );

  const nextPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'post')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date desc]',
    }
  );

  // console.log(JSON.stringify(response, null, 2));

  // TODO;
  const post = {
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    // first_publication_date: format(
    //   new Date(response.first_publication_date),
    //   'dd MMM yyyy',
    //   {
    //     locale: ptBR,
    //   }
    // ),
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => ({
        heading: content.heading,
        body: content.body.map(body => ({ text: body.text })),
      })),
    },
  };
  // console.log(JSON.stringify(post, null, 2));

  const sugestions = {
    prevPost: prevPost?.results,
    nextPost: nextPost?.results,
  };

  return {
    props: {
      post,
      sugestions,
    },
    redirect: 60 * 30, // 30 minutes
  };
};
