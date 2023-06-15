"use client"
import { useEffect, useState } from "react";
import clsx from "clsx";
import ClipLoader from "react-spinners/ClipLoader";

const SERVER_URL = "https://cdd3-80-115-239-91.ngrok-free.app";

export default function Home() {
  const [commitUrl, setCommitUrl] = useState('');
  const [commitSignature, setCommitSignature] = useState({
    message: '',
    signature: '',
  });
  const [isProofLoading, setIsProofLoading] = useState(false); // added state for loading
  const [proof, setProof] = useState("");
  const [isProofValid, setIsProofValid] = useState(null);

  const loadCommitFromUrl = async (url) => {
    const parts = url.split("/");
    const owner = parts[parts.length - 4];
    const repo = parts[parts.length - 3];
    const ref = parts[parts.length - 1];

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/commits/${ref}`;

    const response = await fetch(apiUrl);
    const jsonData = await response.json();
    setCommitSignature({ message: jsonData.commit.verification.payload, signature: jsonData.commit.verification.signature });
  }

  const generateProof = async () => {
    setIsProofLoading(true);
    try {
      const response = await fetch(`${SERVER_URL}/generate-proof`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ssh_sig: commitSignature.signature,
          raw_msg: commitSignature.message,
        }),
      });
      const result = await response.json();
      setProof(result);
    } catch (e) {
      console.error(e);
      setProof("");
    }
    setIsProofLoading(false);
  }

  const verifyProof = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/verify-proof`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          proof,
        }),
      });
      const result = await response.json();
      setIsProofValid(result);
    } catch (e) {
      console.error(e);
      setIsProofValid(false);
    }
  }

  useEffect(() => {
    setIsProofValid(null);
  }, [proof]);

  return (
    <div className="h-screen container mx-auto p-8">
      <h1 className="text-center font-bold text-2xl mb-4">Halo2 ed25519 Github Signature Verification</h1>
      <div className="mb-4">
        <label className="block text-sm font-bold mb-2" htmlFor="commitUrl">
          Github Commit URL
        </label>
        <div className="flex">
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="commitUrl"
            type="text"
            placeholder="Github Commit URL"
            value={commitUrl}
            onChange={(e) => setCommitUrl(e.target.value)}
          />
          <button
            className="ml-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={() => loadCommitFromUrl(commitUrl)}
          >
            Load
          </button>
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-bold mb-2" htmlFor="signature">
          Signature
        </label>
        <textarea
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="signature"
          rows={8}
          value={commitSignature.signature}
          onChange={(e) => setCommitSignature(prev => ({ ...prev, signature: e.target.value }))}
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-bold mb-2" htmlFor="message">
          Message
        </label>
        <textarea
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="message"
          rows={8}
          value={commitSignature.message}
          onChange={(e) => setCommitSignature(prev => ({ ...prev, message: e.target.value }))}
        />
      </div>

      <div className="flex flex-row items-center mb-4">
        <button
          className={clsx("w-48 h-12 bg-green-500 text-white font-bold py-2 px-4 mr-4 rounded focus:outline-none focus:shadow-outline", {"hover:bg-green-700": !isProofLoading, "cursor-not-allowed": isProofLoading})}
          onClick={generateProof}
          disabled={isProofLoading}
        >
          Generate Proof
        </button>
        <ClipLoader
          color="#fff"
          loading={isProofLoading}
          size={32}
          aria-label="Loading Spinner"
          data-testid="loader"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-bold mb-2" htmlFor="message">
          Proof
        </label>
        <textarea
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="message"
          rows={8}
          value={proof}
          onChange={(e) => setProof(e.target.value)}
        />
      </div>

      <button
        className="w-48 h-12 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        onClick={verifyProof}
      >
        Verify Proof
      </button>
      {isProofValid !== null && (<span className="ml-4">
        {isProofValid ? "Passed! ✅" : "Failed! ❌"}
      </span>)}
    </div>
  )
}
