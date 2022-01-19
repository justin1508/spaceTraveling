import { useEffect } from 'react';

const commentNodeId = 'comments';

interface CommentsProps {
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

const Comments = ({ sugestions }: CommentsProps): JSX.Element => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://utteranc.es/client.js';
    script.async = true;
    script.setAttribute('repo', 'justin1508/spaceTraveling');
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('label', 'Comment');
    script.setAttribute('theme', 'dark-blue');
    script.setAttribute('crossorigin', 'anonymous');
    const scriptParentNode = document.getElementById(commentNodeId);
    scriptParentNode.appendChild(script);
    return () => {
      scriptParentNode.removeChild(scriptParentNode.firstChild);
    };
  }, [sugestions]);

  return <div id={commentNodeId} />;
};

export default Comments;
