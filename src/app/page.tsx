"use client";
import { useEffect, useState } from "react";
import clsx from "clsx";
import ClipLoader from "react-spinners/ClipLoader";

const SERVER_URL = "http://localhost:8000";

export default function Home() {
  const [commitUrl, setCommitUrl] = useState("");
  const [commitSignature, setCommitSignature] = useState({
    message: "",
    signature: "",
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
    setCommitSignature({
      message: jsonData.commit.verification.payload,
      signature: jsonData.commit.verification.signature,
    });
  };

  const generateProof = async () => {
    setIsProofLoading(true);
    try {
      const response = await fetch(`${SERVER_URL}/generate-proof`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
  };

  const verifyProof = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/verify-proof`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
  };

  useEffect(() => {
    setIsProofValid(null);
  }, [proof]);

  return (
    <div className="container mx-auto h-screen p-8">
      <h1 className="mb-4 text-center text-2xl font-bold">
        Halo2 ed25519 Github Signature Verification
      </h1>
      <div className="mb-4">
        <label className="mb-2 block text-sm font-bold" htmlFor="commitUrl">
          Github Commit URL
        </label>
        <div className="flex">
          <input
            className="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
            id="commitUrl"
            type="text"
            placeholder="Github Commit URL"
            value={commitUrl}
            onChange={(e) => setCommitUrl(e.target.value)}
          />
          <button
            className="focus:shadow-outline ml-2 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 focus:outline-none"
            onClick={() => loadCommitFromUrl(commitUrl)}
          >
            Load
          </button>
        </div>
      </div>
      <div className="mb-4">
        <label className="mb-2 block text-sm font-bold" htmlFor="signature">
          Signature
        </label>
        <textarea
          className="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
          id="signature"
          rows={8}
          value={commitSignature.signature}
          onChange={(e) =>
            setCommitSignature((prev) => ({
              ...prev,
              signature: e.target.value,
            }))
          }
        />
      </div>
      <div className="mb-4">
        <label className="mb-2 block text-sm font-bold" htmlFor="message">
          Message
        </label>
        <textarea
          className="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
          id="message"
          rows={8}
          value={commitSignature.message}
          onChange={(e) =>
            setCommitSignature((prev) => ({ ...prev, message: e.target.value }))
          }
        />
      </div>

      <div className="mb-4 flex flex-row items-center">
        <button
          className={clsx(
            "focus:shadow-outline mr-4 h-12 w-48 rounded bg-green-500 px-4 py-2 font-bold text-white focus:outline-none",
            {
              "hover:bg-green-700": !isProofLoading,
              "cursor-not-allowed": isProofLoading,
            },
          )}
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
        <label className="mb-2 block text-sm font-bold" htmlFor="message">
          Proof
        </label>
        <textarea
          className="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
          id="message"
          rows={8}
          value={proof}
          onChange={(e) => setProof(e.target.value)}
        />
      </div>

      <button
        className="focus:shadow-outline h-12 w-48 rounded bg-green-500 px-4 py-2 font-bold text-white hover:bg-green-700 focus:outline-none"
        onClick={verifyProof}
      >
        Verify Proof
      </button>
      {isProofValid !== null && (
        <span className="ml-4">
          {isProofValid ? "Passed! ✅" : "Failed! ❌"}
        </span>
      )}
    </div>
  );
}
